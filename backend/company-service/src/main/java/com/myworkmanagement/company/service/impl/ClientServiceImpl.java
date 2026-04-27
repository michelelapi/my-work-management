package com.myworkmanagement.company.service.impl;

import com.myworkmanagement.company.dto.ClientDTO;
import com.myworkmanagement.company.entity.Client;
import com.myworkmanagement.company.entity.Project;
import com.myworkmanagement.company.exception.ResourceNotFoundException;
import com.myworkmanagement.company.repository.ClientRepository;
import com.myworkmanagement.company.repository.ProjectRepository;
import com.myworkmanagement.company.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ClientDTO> getAllClientsByProjectId(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId);
        }
        return clientRepository.findByProjectId(projectId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ClientDTO getClientById(Long projectId, Long clientId) {
        return clientRepository.findByIdAndProjectId(clientId, projectId)
                .map(this::mapToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + clientId + " for project: " + projectId));
    }

    @Override
    public ClientDTO createClient(Long projectId, ClientDTO clientDTO) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        if (clientRepository.existsByProjectIdAndName(projectId, clientDTO.getName())) {
            throw new IllegalArgumentException("Client with name \"" + clientDTO.getName() + "\" already exists for this project.");
        }

        Client client = mapToEntity(clientDTO);
        client.setProject(project);
        client.setUserEmail(clientDTO.getUserEmail());
        return mapToDTO(clientRepository.save(client));
    }

    @Override
    public ClientDTO updateClient(Long projectId, Long clientId, ClientDTO clientDTO) {
        Client existingClient = clientRepository.findByIdAndProjectId(clientId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + clientId + " for project: " + projectId));

        if (clientDTO.getName() != null && !existingClient.getName().equals(clientDTO.getName()) 
                && clientRepository.existsByProjectIdAndName(projectId, clientDTO.getName())) {
            throw new IllegalArgumentException("Client with name \"" + clientDTO.getName() + "\" already exists for this project.");
        }

        updateClientFromDTO(existingClient, clientDTO);
        return mapToDTO(clientRepository.save(existingClient));
    }

    @Override
    public void deleteClient(Long projectId, Long clientId) {
        if (!clientRepository.findByIdAndProjectId(clientId, projectId).isPresent()) {
            throw new ResourceNotFoundException("Client not found with id: " + clientId + " for project: " + projectId);
        }
        clientRepository.deleteById(clientId);
    }

    private ClientDTO mapToDTO(Client client) {
        return ClientDTO.builder()
                .id(client.getId())
                .projectId(client.getProject().getId())
                .name(client.getName())
                .description(client.getDescription())
                .contactEmail(client.getContactEmail())
                .contactPhone(client.getContactPhone())
                .projectManagerName(client.getProjectManagerName())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .userEmail(client.getUserEmail())
                .build();
    }

    private Client mapToEntity(ClientDTO dto) {
        return Client.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .contactEmail(dto.getContactEmail())
                .contactPhone(dto.getContactPhone())
                .projectManagerName(dto.getProjectManagerName())
                .userEmail(dto.getUserEmail())
                .build();
    }

    private void updateClientFromDTO(Client client, ClientDTO dto) {
        if (dto.getName() != null) client.setName(dto.getName());
        if (dto.getDescription() != null) client.setDescription(dto.getDescription());
        if (dto.getContactEmail() != null) client.setContactEmail(dto.getContactEmail());
        if (dto.getContactPhone() != null) client.setContactPhone(dto.getContactPhone());
        if (dto.getProjectManagerName() != null) client.setProjectManagerName(dto.getProjectManagerName());
    }
}
