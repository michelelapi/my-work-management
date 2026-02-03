package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.ClientDTO;

import java.util.List;

public interface ClientService {
    List<ClientDTO> getAllClientsByProjectId(Long projectId);
    
    ClientDTO getClientById(Long projectId, Long clientId);
    
    ClientDTO createClient(Long projectId, ClientDTO clientDTO);
    
    ClientDTO updateClient(Long projectId, Long clientId, ClientDTO clientDTO);
    
    void deleteClient(Long projectId, Long clientId);
}
