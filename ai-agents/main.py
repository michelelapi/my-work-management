import os
import json
import requests
import logging
from typing import Dict, List, Optional, Tuple, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from chromadb.config import Settings
from anthropic import Anthropic
from dotenv import load_dotenv
import config
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="AI Agent Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],  # Or ["POST", "OPTIONS"]
    allow_headers=["*"],
)

class UserRequest(BaseModel):
    text: str
    auth_token: Optional[str] = None
    user_email: str
    output_format: Optional[str] = None # New field: 'json', 'table', or 'text'

class EndpointInfo(BaseModel):
    path: str
    method: str
    description: str
    parameters: Dict

class APIOrchestrator:
    def __init__(self, vector_db, llm_client):
        self.vector_db = vector_db
        self.claude_client = llm_client
        self.execution_context = {}
        self.auth_token = None
        self.user_email = None
        self.response_cache = {}  # Cache for API responses
    
    def set_auth_token(self, token: str):
        """Set the authentication token for API calls"""
        self.auth_token = token
    
    def set_user_email(self, email: str):
        """Set the user email for filtering"""
        self.user_email = email
    
    async def extract_intent(self, request_text: str) -> Dict:
        """Extract intent and entities from user request"""
        prompt = f"""Given this user request: "{request_text}"

Extract the intent and entities in this JSON format:
{{
    "primary_action": "action_type",  // e.g., create_contact, update_company
    "entities": {{
        "entity_type": {{
            "name": "entity_name",
            "identifier_type": "name|id",
            "attributes": {{
                "key": "value"
            }}
        }}
    }},
    "dependencies": []  // List of required sub-actions
}}

Return ONLY the JSON object."""
        
        response = self.claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text.strip()
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            return json.loads(content[json_start:json_end])
        raise ValueError("Failed to extract intent from response")

    async def find_relevant_endpoints(self, intent: Dict) -> List[Dict]:
        """Find relevant endpoints based on intent and semantic tags"""
        try:
            # Search by primary action
            primary_matches = self.vector_db.query(
                query_texts=[intent["primary_action"]],
                n_results=10
            )
            
            # Search by entity types
            entity_matches = []
            for entity_type in intent["entities"].keys():
                matches = self.vector_db.query(
                    query_texts=[entity_type],
                    n_results=5
                )
                if matches and matches["documents"] and matches["documents"][0]:
                    entity_matches.extend(matches["documents"][0])
            
            # Combine and rank results
            all_matches = set()
            
            # Process primary matches
            if primary_matches and primary_matches["documents"] and primary_matches["documents"][0]:
                for match in primary_matches["documents"][0]:
                    try:
                        endpoint = json.loads(match)
                        if not endpoint['path'].endswith('/search'):
                            all_matches.add(json.dumps(endpoint))
                    except Exception as e:
                        logger.error(f"Error processing primary match: {str(e)}")
                        continue
            
            # Process entity matches
            for match in entity_matches:
                try:
                    endpoint = json.loads(match)
                    if not endpoint['path'].endswith('/search'):
                        all_matches.add(json.dumps(endpoint))
                except Exception as e:
                    logger.error(f"Error processing entity match: {str(e)}")
                    continue
            
            logger.info(f"Found {len(all_matches)} relevant endpoints")
            for match in all_matches:
                endpoint = json.loads(match)
                logger.info(f"Endpoint: {endpoint['method']} {endpoint['path']}")
            
            return [json.loads(match) for match in all_matches]
        except Exception as e:
            logger.error(f"Error in find_relevant_endpoints: {str(e)}")
            raise ValueError(f"Failed to find relevant endpoints: {str(e)}")

    async def _fetch_and_filter_entities(self, entity_type: str, filter_criteria: Dict) -> Optional[Dict]:
        """Fetch entities and filter them locally based on criteria"""
        try:
            # Find the base endpoint for the entity type
            base_endpoint = None
            results = self.vector_db.query(
                query_texts=[f"GET /api/{entity_type}s"],
                n_results=1
            )
            
            if results and results["documents"] and results["documents"][0]:
                base_endpoint = json.loads(results["documents"][0][0])
            
            if not base_endpoint:
                logger.error(f"Could not find base endpoint for {entity_type}")
                return None
            
            # Fetch all entities
            url = f"{config.COMPANY_SERVICE_URL}{base_endpoint['path']}"
            headers = {}
            if self.auth_token:
                headers['Authorization'] = f'Bearer {self.auth_token}'
            
            logger.info(f"Fetching {entity_type}s from: {url}")
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            # Handle paginated response
            if isinstance(data, dict) and 'content' in data:
                data = data['content']
            
            if not isinstance(data, list):
                data = [data] if data else []
            
            # Filter by user email
            filtered_data = [item for item in data if item.get('userEmail') == self.user_email]
            
            # Apply additional filters
            for key, value in filter_criteria.items():
                if value:
                    filtered_data = [
                        item for item in filtered_data 
                        if str(value).lower() in str(item.get(key, '')).lower()
                    ]
            
            logger.info(f"Found {len(filtered_data)} matching {entity_type}s")
            return filtered_data[0] if filtered_data else None
            
        except Exception as e:
            logger.error(f"Error fetching and filtering {entity_type}s: {str(e)}")
            return None

    async def generate_execution_plan(self, intent: Dict, endpoints: List[Dict]) -> Dict:
        """Generate an execution plan based on intent and available endpoints"""
        prompt = f"""Given this intent:
{json.dumps(intent, indent=2)}

And these available endpoints:
{json.dumps(endpoints, indent=2)}

Create an execution plan in this format:
{{
    "execution_plan": [
        {{
            "step": 1,
            "endpoint": "/api/endpoint",  // For direct API calls
            "method": "GET|POST|PUT|DELETE",
            "purpose": "purpose_of_step",
            "parameters": {{
                "param": "value"
            }},
            "output_mapping": {{
                "output_key": "$.path.to.value"
            }},
            "depends_on": [],  // List of step numbers this depends on
            "local_filter": {{  // For local filtering operations
                "entity_type": "company|contact|project|task",
                "criteria": {{
                    "name": "entity_name",
                    "email": "entity_email",
                    // other filter criteria
                }}
            }}
        }}
    ]
}}

Rules:
1. Include all necessary steps to fulfill the intent
2. Handle dependencies between steps
3. Map outputs from one step to inputs of dependent steps
4. Include error handling considerations
5. For entity lookups by name or other criteria:
   - If there's a direct search endpoint, use it
   - If not, use local_filter to fetch all entities and filter them
6. Always include user_email in local filtering

Return ONLY the JSON object."""
        
        response = self.claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text.strip()
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            return json.loads(content[json_start:json_end])
        raise ValueError("Failed to generate execution plan")

    async def execute_plan(self, plan: Dict) -> Dict:
        """Execute a plan of API calls"""
        try:
            results = {}
            resolved_params = {}
            step_results = {}  # Store all step results for context
            
            for step in plan['execution_plan']:
                step_name = f"step_{step['step']}"  # Use step number as name
                logger.info(f"Executing step: {step_name}")

                # Check if we should execute this step based on its purpose and previous step results
                if 'purpose' in step and step['step'] > 1:
                    purpose = step['purpose']
                    logger.info(f"Step purpose: {purpose}")
                    
                    # Get the previous step's result
                    prev_step_name = f"step_{step['step'] - 1}"
                    prev_step_result = step_results.get(prev_step_name)
                    
                    if purpose == "create_company_if_not_exists" and prev_step_result:
                        # If previous step found a company, skip this step
                        if prev_step_result.get('id'):
                            logger.info(f"Company already exists (ID: {prev_step_result['id']}), skipping step {step_name}")
                            # Store the company ID for future steps
                            if 'output_mapping' in step:
                                for param_name, json_path in step['output_mapping'].items():
                                    resolved_params[param_name] = prev_step_result['id']
                            continue
                        logger.info(f"No existing company found, proceeding with step {step_name}")
                
                # Use Claude to resolve parameters based on previous step results only for step 2 and onwards
                if 'parameters' in step and step['step'] > 1:
                    # Get the previous step's data and output mapping
                    prev_step_name = f"step_{step['step'] - 1}"
                    prev_step_result = step_results.get(prev_step_name)
                    prev_step = next((s for s in plan['execution_plan'] if s['step'] == step['step'] - 1), None)
                    
                    prompt = f"""Using this data:
{json.dumps(prev_step_result, indent=2)}

And this output mapping:
{json.dumps(prev_step.get('output_mapping', {}), indent=2)}

Replace the parameter in this URL:
{step['endpoint']}

Return only the final URL with the parameter replaced."""

                    response = self.claude_client.messages.create(
                        model="claude-sonnet-4-20250514",
                        max_tokens=100,
                        temperature=0,
                        system="You are a helpful assistant that replaces URL parameters with values from previous step results.",
                        messages=[{"role": "user", "content": prompt}]
                    )
                    
                    try:
                        # Get the replaced URL from Claude's response
                        replaced_url = response.content[0].text.strip()
                        step['endpoint'] = replaced_url
                        logger.info(f"Claude replaced URL: {replaced_url}")
                    except Exception as e:
                        logger.error(f"Failed to get URL from Claude's response: {e}")
                        logger.error(f"Claude's response: {response.content[0].text}")
                
                # Handle request_body parameter replacement
                if "request_body" in step:
                    logger.info(f"Original request_body for step {step_name}: {step['request_body']}")
                    # Create a mutable copy of request_body for replacement
                    current_request_body = step["request_body"].copy()
                    
                    # Create a case-insensitive version of resolved_params for easier lookup
                    resolved_params_lower_keys = {k.lower(): v for k, v in resolved_params.items()}
                    logger.info(f"Resolved params (lower keys) before request_body processing: {resolved_params_lower_keys}")

                    for key, value in current_request_body.items():
                        logger.info(f"Processing request_body key: {key}, value: {value}")
                        if isinstance(value, str) and value.startswith('{{') and value.endswith('}}'):
                            logger.info(f"Found double curly brace reference: {value}")
                            # This is a reference to a previous step result (e.g., "{{step_2.project_id}}")
                            ref_name = value[2:-2]  # Remove {{ and }}
                            
                            # Handle step references like "step_2.project_id"
                            if '.' in ref_name:
                                # Extract just the parameter name (e.g., "project_id" from "step_2.project_id")
                                actual_param_name = ref_name.split('.')[-1]
                                actual_param_name_lower = actual_param_name.lower()
                                logger.info(f"Parsed ref_name: {ref_name}, actual_param_name: {actual_param_name}, lower: {actual_param_name_lower}")

                                if actual_param_name_lower in resolved_params_lower_keys:
                                    current_request_body[key] = resolved_params_lower_keys[actual_param_name_lower]
                                    logger.info(f"SUCCESS: Replaced request_body parameter {key} with {resolved_params_lower_keys[actual_param_name_lower]} from {ref_name}")
                                else:
                                    logger.warning(f"FAIL: Could not resolve request_body parameter {key} with reference {ref_name}. Actual param '{actual_param_name}' (lower: '{actual_param_name_lower}') not found in resolved_params_lower_keys.")
                            elif ref_name.lower() in resolved_params_lower_keys:
                                # Direct reference without step prefix (e.g., {{project_id}}) - case-insensitive lookup
                                current_request_body[key] = resolved_params_lower_keys[ref_name.lower()]
                                logger.info(f"SUCCESS: Replaced request_body parameter {key} with {resolved_params_lower_keys[ref_name.lower()]} from {ref_name}")
                            else:
                                logger.warning(f"FAIL: Could not resolve request_body parameter {key} with reference {ref_name}.")
                        elif isinstance(value, str) and value.startswith('{') and value.endswith('}'): # Handle single curly braces too if they might exist
                            logger.info(f"Found single curly brace reference: {value}")
                            ref = value[1:-1]
                            if ref.lower() in resolved_params_lower_keys:
                                current_request_body[key] = resolved_params_lower_keys[ref.lower()]
                                logger.info(f"SUCCESS: Replaced request_body parameter {key} with {resolved_params_lower_keys[ref.lower()]}")
                            else:
                                logger.warning(f"FAIL: Could not resolve request_body parameter {key} with reference {ref}")
                    # Update the step's request_body with the resolved values
                    step['request_body'] = current_request_body
                    logger.info(f"Final request_body for step {step_name} after processing: {step['request_body']}")
                
                # Execute the step
                response = await self._execute_api_call(step, resolved_params)
                results[step_name] = response
                step_results[step_name] = response  # Store the result for future steps
                
                # Handle output mapping
                if "output_mapping" in step:
                    for param_name, json_path in step["output_mapping"].items():
                        value = self._extract_value_from_json(response, json_path)
                        resolved_params[param_name] = value
                        logger.info(f"Mapped output {param_name} to {value} using path {json_path}")
                
                # Handle request body parameters
                if "request_body" in step:
                    for key, value in step["request_body"].items():
                        if isinstance(value, str) and value.startswith('{') and value.endswith('}'):
                            ref = value[1:-1]
                            if ref in resolved_params:
                                resolved_params[key] = resolved_params[ref]
                                logger.info(f"Resolved parameter {key} to {resolved_params[ref]} from step {ref}")
            
            return results
            
        except Exception as e:
            logger.error(f"Error executing plan: {str(e)}")
            raise

    def _dependencies_ready(self, step: Dict, results: Dict) -> bool:
        """Check if all dependencies for a step are ready"""
        if not step.get("depends_on"):
            return True
        return all(dep in results for dep in step["depends_on"])

    def _resolve_parameters(self, step: Dict, results: Dict) -> Dict:
        """Resolve parameters using results from previous steps"""
        resolved = {}
        for key, value in step["parameters"].items():
            if isinstance(value, str) and value.startswith("${"):
                # Extract step number and path
                match = re.match(r"\${step(\d+)\.(.+)}", value)
                if match:
                    step_num, path = match.groups()
                    step_num = int(step_num)
                    if step_num in results:
                        resolved[key] = self._get_nested_value(results[step_num]["outputs"], path)
            else:
                resolved[key] = value
        return resolved

    def _get_nested_value(self, obj: Dict, path: str) -> Any:
        """Get a nested value from a dictionary using dot notation"""
        for key in path.split("."):
            if isinstance(obj, dict):
                obj = obj.get(key)
            else:
                return None
        return obj

    def _extract_outputs(self, step: Dict, response: Dict) -> Dict:
        """Extract outputs from response using output mapping"""
        outputs = {}
        for key, path in step.get("output_mapping", {}).items():
            outputs[key] = self._get_nested_value(response, path.lstrip("$."))
        return outputs

    async def replan_on_failure(self, failed_step: Dict, original_plan: Dict) -> Optional[Dict]:
        """Generate an alternative plan when a step fails"""
        prompt = f"""Given this failed step:
{json.dumps(failed_step, indent=2)}

And the original execution plan:
{json.dumps(original_plan, indent=2)}

Generate an alternative plan that achieves the same goal.
Consider:
1. Different endpoints that provide similar functionality
2. Alternative approaches to get required data
3. Breaking down the step into smaller steps

Return the new execution plan in the same format as the original.
Return ONLY the JSON object."""
        
        response = self.claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text.strip()
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            return json.loads(content[json_start:json_end])
        return None

    def _get_cache_key(self, method: str, url: str, params: Dict) -> str:
        """Generate a unique cache key for an API request"""
        return f"{method}:{url}:{json.dumps(params, sort_keys=True)}"
    
    def _get_cached_response(self, cache_key: str) -> Optional[Dict]:
        """Get a cached response if available"""
        return self.response_cache.get(cache_key)
    
    def _cache_response(self, cache_key: str, response: Dict):
        """Cache an API response"""
        self.response_cache[cache_key] = response

    async def _execute_api_call(self, step: Dict, resolved_params: Dict) -> Dict:
        """Execute an API call for a step in the execution plan"""
        try:
            # Check if this is a local filtering operation
            if step.get('local_filter'):
                entity_type = step['local_filter']['entity_type']
                filter_criteria = step['local_filter']['criteria']
                result = await self._fetch_and_filter_entities(entity_type, filter_criteria)
                if not result:
                    raise ValueError(f"No matching {entity_type} found")
                return result
            
            # Regular API call
            url = f"{config.COMPANY_SERVICE_URL}{step['endpoint']}"
            headers = {}
            if self.auth_token:
                headers['Authorization'] = f'Bearer {self.auth_token}'

            # --- FIXED URL parameter replacement ---
            # Handle both direct parameter values and references to previous steps
            if 'parameters' in step:
                for param_name, param_value in step['parameters'].items():
                    if isinstance(param_value, str) and param_value.startswith('{{') and param_value.endswith('}}'):
                        # This is a reference to a previous step result
                        ref_name = param_value[2:-2]  # Remove {{ and }}
                        
                        # Handle step references like "step_1.company_id"
                        if '.' in ref_name:
                            # Extract just the parameter name (e.g., "company_id" from "step_1.company_id")
                            actual_param_name = ref_name.split('.')[-1]
                            if actual_param_name in resolved_params:
                                url = url.replace(f"{{{param_name}}}", str(resolved_params[actual_param_name]))
                                logger.info(f"Replaced {param_name} with value {resolved_params[actual_param_name]} from {ref_name}")
                        elif ref_name in resolved_params:
                            # Direct reference without step prefix
                            url = url.replace(f"{{{param_name}}}", str(resolved_params[ref_name]))
                            logger.info(f"Replaced {param_name} with value {resolved_params[ref_name]} from {ref_name}")
                    else:
                        # This is a direct parameter value (like "pippo")
                        url = url.replace(f"{{{param_name}}}", str(param_value))
                        logger.info(f"Replaced {param_name} with direct value {param_value}")

            logger.info(f"Final URL after replacement: {url}")

            # Find all path params used in the URL
            used_path_params = set()
            if 'parameters' in step:
                for param_name in step['parameters'].keys():
                    if f"{{{param_name}}}" not in url:  # Only consider it used if it was actually replaced
                        continue
                    used_path_params.add(param_name)

            query_params = {}
            body_params = {}
            
            # Only add request body parameters from the request_body section
            if "request_body" in step:
                body_params = step["request_body"].copy()
            # PATCH: If POST/PUT and no request_body, but parameters exist, use parameters as body
            elif step["method"] in ["POST", "PUT"] and "parameters" in step:
                body_params = step["parameters"].copy()

            # Generate cache key
            cache_key = self._get_cache_key(step['method'], url, query_params if step['method'] in ['GET', 'DELETE'] else body_params)
            
            # Check cache first
            cached_response = self._get_cached_response(cache_key)
            if cached_response:
                logger.info(f"Using cached response for {step['method']} {url}")
                return cached_response

            # Make the API call
            logger.info(f"Making {step['method']} request to: {url}")
            logger.info(f"Query Parameters: {query_params}")
            logger.info(f"Body Parameters: {body_params}")
            logger.info(f"Headers: {headers}")

            if step['method'] == 'GET':
                response = requests.get(url, params=query_params, headers=headers)
            elif step['method'] == 'POST':
                response = requests.post(url, json=body_params, headers=headers)
            elif step['method'] == 'PUT':
                response = requests.put(url, json=body_params, headers=headers)
            elif step['method'] == 'DELETE':
                response = requests.delete(url, params=query_params, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {step['method']}")

            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response body: {response.text}")

            if response.status_code >= 400:
                logger.error(f"API call failed: {response.status_code} {response.reason}")
                logger.error(f"Error response body: {response.text}")
                raise ValueError(f"API call failed: {response.status_code} {response.reason}")

            # Parse response
            try:
                result = response.json()
            except json.JSONDecodeError:
                result = {"raw_response": response.text}

            # Cache successful response
            self._cache_response(cache_key, result)

            return result

        except Exception as e:
            logger.error(f"Unexpected error in API call: {str(e)}")
            raise

    def _extract_value_from_json(self, json_data: Dict, json_path: str) -> Any:
        """Extract a value from JSON data using a JSON path expression"""
        try:
            if json_path == "$":
                return json_data
            
            # Handle simple dot notation paths
            parts = json_path.lstrip('$.').split('.')
            current = json_data
            
            for part in parts:
                if isinstance(current, dict):
                    current = current.get(part)
                elif isinstance(current, list) and part.isdigit():
                    current = current[int(part)]
                else:
                    return None
                
                if current is None:
                    return None
            
            return current
            
        except Exception as e:
            logger.error(f"Error extracting value from JSON: {str(e)}")
            return None

def fetch_swagger_docs() -> Dict:
    """Fetch Swagger documentation from the company service"""
    try:
        logger.info(f"Fetching Swagger docs from {config.COMPANY_SERVICE_URL}/v3/api-docs")
        response = requests.get(f"{config.COMPANY_SERVICE_URL}/v3/api-docs")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Failed to fetch Swagger docs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch Swagger docs: {str(e)}")

def _resolve_swagger_schema_reference(swagger_docs: Dict, schema_ref: str) -> Dict[str, Any]:
    """Resolves a schema reference from the full Swagger documentation.
    Returns the properties of the resolved schema.
    """
    try:
        # Expected format: "#/components/schemas/SchemaName"
        parts = schema_ref.split('/')
        if len(parts) >= 4 and parts[1] == 'components' and parts[2] == 'schemas':
            schema_name = parts[3]
            schema_definition = swagger_docs.get('components', {}).get('schemas', {}).get(schema_name)
            if schema_definition and 'properties' in schema_definition:
                # Also include required fields if present in the top-level schema definition
                properties = schema_definition['properties']
                required_fields = schema_definition.get('required', [])
                
                # Augment properties with 'required' flag if it exists in the top-level required_fields
                # Create a new dictionary to avoid modifying the original properties in-place
                resolved_props = {}
                for prop_name, prop_details in properties.items():
                    resolved_props[prop_name] = prop_details.copy() # Make a copy to add 'required'
                    if prop_name in required_fields:
                        resolved_props[prop_name]['required'] = True
                
                return resolved_props
    except Exception as e:
        logger.error(f"Error resolving schema reference {schema_ref}: {e}")
    return {} # Return empty dict if not found or error

def process_swagger_docs(swagger_docs: Dict) -> List[Dict]:
    """Process Swagger documentation and extract endpoint information with semantic metadata"""
    try:
        endpoints = []
        for path, methods in swagger_docs.get("paths", {}).items():
            for method, details in methods.items():
                if method.lower() in ["get", "post", "put", "delete"]:
                    # Extract request body information
                    request_body_info = {}
                    if "requestBody" in details:
                        content = details["requestBody"].get("content", {})
                        if "application/json" in content:
                            schema = content["application/json"].get("schema", {})
                            if "$ref" in schema:
                                # Resolve the schema reference to get actual properties
                                resolved_properties = _resolve_swagger_schema_reference(swagger_docs, schema['$ref'])
                                request_body_info = {
                                    "properties": resolved_properties,
                                    "description": details["requestBody"].get("description", ""),
                                    "required": details["requestBody"].get("required", False) # This required refers to the whole request body
                                }
                            else:
                                # If no ref, store the schema properties as is
                                request_body_info = {
                                    "properties": schema.get("properties", {}),
                                    "description": details["requestBody"].get("description", ""),
                                    "required": details["requestBody"].get("required", False)
                                }
                    
                    # Extract parameters information
                    parameters = []
                    if "parameters" in details:
                        for param in details["parameters"]:
                            param_info = {
                                "name": param.get("name", ""),
                                "in": param.get("in", ""),
                                "required": param.get("required", False),
                                "schema": param.get("schema", {})
                            }
                            parameters.append(param_info)
                    
                    # Extract semantic information
                    description = details.get("summary", "")
                    operation_id = details.get("operationId", "")
                    
                    # Generate semantic tags based on path, method, and description
                    semantic_tags = set()
                    semantic_tags.update(path.split('/'))
                    semantic_tags.add(method.lower())
                    semantic_tags.update(description.lower().split())
                    
                    # Determine what this endpoint provides
                    provides = set()
                    if method.lower() == "get":
                        if "search" in path.lower() or "find" in description.lower():
                            provides.add("search_results")
                        if "id" in path.lower():
                            provides.add("entity_details")
                    elif method.lower() == "post":
                        provides.add("created_entity")
                    elif method.lower() == "put":
                        provides.add("updated_entity")
                    
                    # Determine common use cases
                    use_cases = set()
                    if "search" in path.lower() or "find" in description.lower():
                        use_cases.add("entity_lookup")
                    if "create" in description.lower() or method.lower() == "post":
                        use_cases.add("entity_creation")
                    if "update" in description.lower() or method.lower() == "put":
                        use_cases.add("entity_update")
                    
                    endpoint_info = {
                        "path": path,
                        "method": method.upper(),
                        "description": description,
                        "operation_id": operation_id,
                        "parameters": parameters,
                        "request_body": request_body_info,
                        "responses": details.get("responses", {}),
                        "semantic_tags": list(semantic_tags),
                        "provides": list(provides),
                        "use_cases": list(use_cases),
                        "metadata": {
                            "complexity_score": len(parameters) + (1 if request_body_info else 0),
                            "dependency_likelihood": 1.0 if method.lower() in ["post", "put"] else 0.5
                        }
                    }
                    endpoints.append(endpoint_info)
        logger.info(f"Processed {len(endpoints)} endpoints from Swagger docs")
        return endpoints
    except Exception as e:
        logger.error(f"Failed to process Swagger docs: {str(e)}")
        raise

def store_endpoints_in_vector_db(endpoints: List[Dict]):
    """Store endpoints in ChromaDB with enhanced metadata"""
    try:
        for endpoint in endpoints:
            # Store the endpoint data directly as JSON in the document
            document = json.dumps(endpoint)
            
            # Create metadata for search
            metadata = {
                "type": "endpoint",
                "path": endpoint['path'],
                "method": endpoint['method'],
                "operation_id": endpoint['operation_id'],
                "semantic_tags": ','.join(endpoint['semantic_tags']),
                "use_cases": ','.join(endpoint['use_cases']),
                "provides": ','.join(endpoint['provides']),
                "complexity_score": endpoint['metadata']['complexity_score'],
                "dependency_likelihood": endpoint['metadata']['dependency_likelihood']
            }
            
            collection.add(
                documents=[document],
                metadatas=[metadata],
                ids=[f"{endpoint['method']}_{endpoint['path']}"]
            )
        logger.info(f"Stored {len(endpoints)} endpoints in vector DB")
    except Exception as e:
        logger.error(f"Failed to store endpoints in vector DB: {str(e)}")
        raise

def extract_path_parameters(path: str) -> List[str]:
    """Extract path parameters from endpoint path"""
    return re.findall(r'{([^}]+)}', path)

def find_base_endpoint_for_entity(entity_type: str, collection) -> Optional[Dict]:
    """Find the base GET endpoint for an entity type (e.g., 'company' -> '/api/companies')"""
    try:
        # Map entity types to their correct plural forms
        plural_forms = {
            'company': 'companies',
            'contact': 'contacts',
            'project': 'projects',
            'task': 'tasks'
        }
        
        plural_form = plural_forms.get(entity_type, f"{entity_type}s")
        
        # First, check if we have any endpoints in the vector DB
        results = collection.query(
            query_texts=["GET /api/companies"],  # Use a known endpoint to check if DB is populated
            n_results=1
        )
        
        if not results or not results["documents"] or not results["documents"][0]:
            logger.info("No endpoints found in vector DB, fetching from Swagger")
            swagger_docs = fetch_swagger_docs()
            endpoints = process_swagger_docs(swagger_docs)
            store_endpoints_in_vector_db(endpoints)
        
        # Search for the base endpoint
        search_queries = [
            f"GET /api/{plural_form}",  # e.g., GET /api/companies
            f"GET {plural_form}",       # e.g., GET companies
            f"GET all {plural_form}",   # e.g., GET all companies
            f"GET {entity_type}"        # e.g., GET company
        ]
        
        for query in search_queries:
            logger.info(f"Searching for base endpoint with query: {query}")
            results = collection.query(
                query_texts=[query],
                n_results=3
            )
            
            if results and results["documents"] and results["documents"][0]:
                for doc in results["documents"][0]:
                    endpoint = json.loads(doc)
                    # Look for exact match of base endpoint pattern
                    if (endpoint['method'] == 'GET' and 
                        f'/api/{plural_form}' in endpoint['path'] and 
                        '{' not in endpoint['path']):
                        logger.info(f"Found base endpoint: {endpoint['method']} {endpoint['path']}")
                        return endpoint
        
        logger.warning(f"No base endpoint found for entity type: {entity_type}")
        return None
        
    except Exception as e:
        logger.error(f"Error finding base endpoint for {entity_type}: {str(e)}")
        return None

def fetch_entities_by_user(entity_type: str, user_email: str, auth_token: Optional[str], collection) -> List[Dict]:
    """Fetch all entities of a given type for a specific user"""
    try:
        base_endpoint = find_base_endpoint_for_entity(entity_type, collection)
        if not base_endpoint:
            logger.error(f"Could not find base endpoint for {entity_type}")
            return []
        
        url = f"{config.COMPANY_SERVICE_URL}{base_endpoint['path']}"
        headers = {}
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'
        
        logger.info(f"Fetching {entity_type}s from: {url}")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        logger.info(f"Response from {url}: {json.dumps(data, indent=2)}")
        
        # Handle paginated response
        if isinstance(data, dict) and 'content' in data:
            data = data['content']
        
        if not isinstance(data, list):
            data = [data] if data else []
        
        # Filter by user email
        filtered_data = [item for item in data if item.get('userEmail') == user_email]
        logger.info(f"Found {len(filtered_data)} {entity_type}s for user {user_email}")
        if filtered_data:
            logger.info(f"First {entity_type} data: {json.dumps(filtered_data[0], indent=2)}")
        
        return filtered_data
        
    except Exception as e:
        logger.error(f"Failed to fetch {entity_type}s for user {user_email}: {str(e)}")
        return []

def find_entity_by_name(entities: List[Dict], name: str, entity_type: str) -> Optional[Dict]:
    """Find an entity by name from a list of entities"""
    try:
        name_lower = name.lower().strip()
        
        # Try exact match first
        for entity in entities:
            entity_name = str(entity.get('name', '')).lower().strip()
            if entity_name == name_lower:
                logger.info(f"Found exact match for {entity_type} '{name}': {entity.get('id')}")
                return entity
        
        # Try partial match
        for entity in entities:
            entity_name = str(entity.get('name', '')).lower().strip()
            if name_lower in entity_name or entity_name in name_lower:
                logger.info(f"Found partial match for {entity_type} '{name}': {entity.get('id')}")
                return entity
        
        logger.warning(f"No {entity_type} found with name '{name}'")
        return None
        
    except Exception as e:
        logger.error(f"Error finding {entity_type} by name '{name}': {str(e)}")
        return None

def extract_entity_names_from_request(request_text: str) -> Dict[str, str]:
    """Extract entity names from the request text using Claude"""
    try:
        prompt = f"""Given this request text: "{request_text}"
        Extract any entity names or IDs mentioned and return them in a JSON object.
        For example:
        - "get the company called TechCorp" -> {{"name": "TechCorp"}}
        - "get the project with id 123" -> {{"id": "123"}}
        - "get contacts of company called ABC Corp" -> {{"name": "ABC Corp"}}
        - "get the company with id 1" -> {{"id": "1"}}
        
        Return ONLY the JSON object with the extracted values."""
        
        response = client.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text.strip()
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            json_str = content[json_start:json_end]
            names = json.loads(json_str)
            logger.info(f"Extracted entity names: {names}")
            return names
        else:
            logger.warning("Could not extract JSON from Claude response")
            return {}
            
    except Exception as e:
        logger.error(f"Error in extract_entity_names_from_request: {str(e)}")
        return {}

def resolve_path_parameter(param_name: str, request_text: str, user_email: str, auth_token: Optional[str], collection, client) -> Optional[str]:
    """Resolve a single path parameter by finding the appropriate entity"""
    try:
        # Determine entity type from parameter name
        entity_type = param_name.replace('Id', '').lower()  # companyId -> company
        
        # Extract entity names from request
        entity_names = extract_entity_names_from_request(request_text)
        
        # Get the name for this entity type
        entity_name = entity_names.get('name')
        
        if not entity_name:
            logger.warning(f"No {entity_type} name found in request: {request_text}")
            return None
        
        # Fetch all entities of this type for the user
        entities = fetch_entities_by_user(entity_type, user_email, auth_token, collection)
        
        if not entities:
            logger.error(f"No {entity_type}s found for user {user_email}")
            return None
        
        # Find the entity by name
        entity = find_entity_by_name(entities, entity_name, entity_type)
        
        if not entity:
            logger.error(f"No {entity_type} found with name '{entity_name}'")
            return None
        
        entity_id = entity.get('id')
        if not entity_id:
            logger.error(f"Entity {entity_type} '{entity_name}' has no ID")
            return None
        
        logger.info(f"Resolved {param_name} = {entity_id} (from {entity_type} '{entity_name}')")
        return str(entity_id)
        
    except Exception as e:
        logger.error(f"Error resolving parameter {param_name}: {str(e)}")
        return None

def resolve_endpoint_parameters(endpoint: Dict, request: UserRequest, collection, client) -> Optional[Dict]:
    """Resolve all path parameters for an endpoint"""
    try:
        path_params = extract_path_parameters(endpoint['path'])
        if not path_params:
            logger.info("No path parameters to resolve")
            return endpoint
        
        logger.info(f"Resolving path parameters: {path_params}")
        
        resolved_path = endpoint['path']
        
        # Handle nested parameters in order (e.g., companyId before projectId)
        # Sort parameters to ensure we resolve in the correct order
        sorted_params = sorted(path_params, key=lambda x: endpoint['path'].index(f'{{{x}}}'))
        
        for param in sorted_params:
            logger.info(f"Resolving parameter: {param}")
            
            param_value = resolve_path_parameter(
                param, 
                request.text, 
                request.user_email, 
                request.auth_token, 
                collection, 
                client
            )
            
            if not param_value:
                logger.error(f"Could not resolve parameter {param}")
                return None
            
            # Replace the parameter in the path
            resolved_path = resolved_path.replace(f'{{{param}}}', param_value)
            logger.info(f"Path after resolving {param}: {resolved_path}")
        
        # Create new endpoint with resolved path
        resolved_endpoint = endpoint.copy()
        resolved_endpoint['path'] = resolved_path
        
        logger.info(f"Final resolved endpoint path: {resolved_path}")
        return resolved_endpoint
        
    except Exception as e:
        logger.error(f"Failed to resolve endpoint parameters: {str(e)}")
        return None

def format_as_table(data: List[Dict]) -> str:
    """Format data as a markdown table"""
    if not data:
        return "No data found"
        
    # Get all unique keys from all items
    headers = set()
    for item in data:
        headers.update(item.keys())
    headers = sorted(list(headers))
    
    # Create header row
    table = "| " + " | ".join(headers) + " |\n"
    table += "| " + " | ".join(["---"] * len(headers)) + " |\n"
    
    # Add data rows
    for item in data:
        row = []
        for header in headers:
            value = item.get(header, "")
            # Convert None to empty string and format dates
            if value is None:
                value = ""
            elif isinstance(value, (dict, list)):
                value = json.dumps(value)
            row.append(str(value))
        table += "| " + " | ".join(row) + " |\n"
    
    return table

def format_as_html(data: List[Dict]) -> str:
    """Format data as an HTML table"""
    if not data:
        return "<p>No data found</p>"

    # Get all unique keys from all items
    headers = set()
    for item in data:
        headers.update(item.keys())
    headers = sorted(list(headers))

    html_table = "<table border=\"1\" style=\"width:100%; border-collapse: collapse;\">\n"
    html_table += "  <thead>\n    <tr>"
    for header in headers:
        html_table += f"<th>{header}</th>"
    html_table += "</tr>\n  </thead>\n"

    html_table += "  <tbody>\n"
    for item in data:
        html_table += "    <tr>"
        for header in headers:
            value = item.get(header, "")
            if value is None:
                value = ""
            elif isinstance(value, (dict, list)):
                value = json.dumps(value) # Represent nested structures as JSON strings
            html_table += f"<td>{value}</td>"
        html_table += "</tr>\n"
    html_table += "  </tbody>\n"
    html_table += "</table>"

    return html_table

def format_as_text(data: List[Dict]) -> str:
    """Format data as plain text with key-value pairs"""
    if not data:
        return "No data found"
        
    result = []
    for i, item in enumerate(data, 1):
        result.append(f"Item {i}:")
        for key, value in item.items():
            if value is not None:  # Skip None values
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                result.append(f"  {key}: {value}")
        result.append("")  # Empty line between items
    
    return "\n".join(result)

# Initialize ChromaDB
try:
    chroma_client = chromadb.Client(Settings(
        persist_directory=config.VECTOR_DB_DIR
    ))
    collection = chroma_client.get_or_create_collection(name="api_endpoints")
    logger.info("ChromaDB initialized successfully")
    
    # Initialize vector DB with endpoints if empty
    try:
        results = collection.get()
        if not results or not results["documents"]:
            logger.info("Vector DB is empty, fetching initial endpoints from Swagger")
            swagger_docs = fetch_swagger_docs()
            endpoints = process_swagger_docs(swagger_docs)
            store_endpoints_in_vector_db(endpoints)
            logger.info("Initial endpoints stored in vector DB")
    except Exception as e:
        logger.error(f"Failed to initialize vector DB with endpoints: {str(e)}")
        raise
except Exception as e:
    logger.error(f"Failed to initialize ChromaDB: {str(e)}")
    raise

# Initialize Claude
try:
    client = Anthropic(api_key=config.CLAUDE_API_KEY)
    logger.info("Claude API initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Claude API: {str(e)}")
    raise

# Initialize the orchestrator
orchestrator = APIOrchestrator(collection, client)

@app.post("/process-request")
async def process_request(request: UserRequest):
    """Process a user request using the enhanced intent recognition and execution system"""
    try:
        logger.info(f"Processing request: {request.text}")
        
        # Set auth token and user email
        if request.auth_token:
            orchestrator.set_auth_token(request.auth_token)
        if request.user_email:
            orchestrator.set_user_email(request.user_email)
        
        # Extract intent
        intent = await orchestrator.extract_intent(request.text)
        logger.info(f"Extracted intent: {json.dumps(intent, indent=2)}")
        
        # Find relevant endpoints
        endpoints = await orchestrator.find_relevant_endpoints(intent)
        logger.info(f"Found {len(endpoints)} relevant endpoints")
        
        # Generate execution plan
        execution_plan = await orchestrator.generate_execution_plan(intent, endpoints)
        logger.info(f"Generated execution plan: {json.dumps(execution_plan, indent=2)}")
        
        # Execute plan
        results = await orchestrator.execute_plan(execution_plan)
        
        formatted_output = results # Default to raw results (which FastAPI will JSON serialize)

        if request.output_format:
            # Assuming the last step's result is the primary output for formatting
            if execution_plan['execution_plan']:
                last_step_name = f"step_{execution_plan['execution_plan'][-1]['step']}"
                final_output_data = results.get(last_step_name)

                if final_output_data:
                    # Try to extract 'content' if it's a dictionary and has that key
                    data_for_formatting_candidate = final_output_data
                    if isinstance(data_for_formatting_candidate, dict) and 'content' in data_for_formatting_candidate:
                        logger.info("Extracting 'content' section from last step's result for formatting.")
                        data_for_formatting_candidate = data_for_formatting_candidate['content']

                    # Ensure data_for_formatting_candidate is a list of dicts for formatting functions
                    data_to_format = []
                    if isinstance(data_for_formatting_candidate, dict):
                        data_to_format = [data_for_formatting_candidate]
                    elif isinstance(data_for_formatting_candidate, list):
                        data_to_format = data_for_formatting_candidate
                    
                    if data_to_format:
                        if request.output_format.lower() == "table":
                            formatted_output = format_as_table(data_to_format)
                        elif request.output_format.lower() == "text":
                            formatted_output = format_as_text(data_to_format)
                        elif request.output_format.lower() == "html":
                            formatted_output = format_as_html(data_to_format)
                        # else: default to raw results (JSON) already handled by FastAPI
                    else:
                        logger.warning(f"Final output data for formatting is empty or not a dict/list: {final_output_data}")
                else:
                    logger.warning(f"Last step '{last_step_name}' produced no output, cannot format.")
                    formatted_output = f"No results from last step to format as {request.output_format}."
            else:
                logger.warning("No steps in execution plan, cannot determine final output for formatting.")
                formatted_output = f"No execution plan to retrieve results for formatting as {request.output_format}."

        return {
            "status": "success",
            "intent": intent,
            "execution_plan": execution_plan,
            "results": formatted_output # This will now contain the formatted string or the original dict
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/list-endpoints")
async def list_endpoints():
    """List all endpoints stored in the vector database"""
    try:
        results = collection.get()
        logger.info(f"Raw results from vector DB: {results}")
        
        if not results or not results["documents"]:
            logger.info("No documents found in vector DB")
            return {"status": "success", "endpoints": []}
            
        endpoints = []
        for doc, metadata, id in zip(results["documents"], results["metadatas"], results["ids"]):
            try:
                # Parse the document as JSON
                endpoint = json.loads(doc[0] if isinstance(doc, list) else doc)
                endpoints.append({
                    "id": id,
                    "path": endpoint.get("path", ""),
                    "method": endpoint.get("method", ""),
                    "description": endpoint.get("description", ""),
                    "parameters": endpoint.get("parameters", {}),
                    "request_body": endpoint.get("request_body", {}),
                    "operation_id": endpoint.get("operation_id", ""),
                    "semantic_tags": endpoint.get("semantic_tags", []),
                    "use_cases": endpoint.get("use_cases", []),
                    "provides": endpoint.get("provides", [])
                })
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse document {id}: {str(e)}")
                logger.error(f"Problematic document content: {doc}")
                continue
            except Exception as e:
                logger.error(f"Error processing document {id}: {str(e)}")
                continue
            
        return {"status": "success", "endpoints": endpoints}
    except Exception as e:
        logger.error(f"Failed to list endpoints: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list endpoints: {str(e)}")

@app.post("/update-endpoints")
async def update_endpoints():
    """Update the vector database with the latest company service endpoints"""
    try:
        logger.info("Starting endpoint update process")
        
        # Fetch latest Swagger docs
        swagger_docs = fetch_swagger_docs()
        logger.info("Successfully fetched Swagger docs")
        
        # Process the docs into endpoint information
        endpoints = process_swagger_docs(swagger_docs)
        logger.info(f"Processed {len(endpoints)} endpoints from Swagger docs")
        
        # Clear existing endpoints from the collection
        collection.delete(where={"type": "endpoint"})
        logger.info("Cleared existing endpoints from vector DB")
        
        # Store new endpoints
        store_endpoints_in_vector_db(endpoints)
        logger.info("Successfully stored new endpoints in vector DB")
        
        return {
            "status": "success",
            "message": f"Successfully updated {len(endpoints)} endpoints in vector database",
            "endpoint_count": len(endpoints)
        }
        
    except Exception as e:
        logger.error(f"Failed to update endpoints: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update endpoints: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT)