package com.ess.portal.service;

import com.ess.portal.dto.*;
import com.ess.portal.entity.*;
import com.ess.portal.exception.BadRequestException;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TravelServiceImpl implements TravelService {

    private final TravelRequestRepository travelRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkflowEngineService workflowEngineService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public TravelRequestResponse submitRequest(String email, TravelRequestDto request) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (request.getReturnDate().isBefore(request.getTravelDate())) {
            throw new BadRequestException("Return date cannot be before travel date");
        }

        TravelRequest travel = new TravelRequest();
        travel.setEmployee(emp);
        travel.setPurpose(request.getPurpose());
        travel.setOrigin("Default Origin");
        travel.setDestination(request.getDestination());
        travel.setStartDate(request.getTravelDate());
        travel.setEndDate(request.getReturnDate());
        travel.setModeOfTransport(request.getModeOfTransport());
        travel.setEstimatedCost(request.getEstimatedCost());
        travel.setAdditionalNotes(request.getAdditionalNotes());
        travel.setStatus("PENDING");
        travel = travelRequestRepository.save(travel);

        try {
            workflowEngineService.initiate("TRAVEL", travel.getId(), emp);
        } catch (Exception e) { /* Non-blocking */ }

        if (emp.getReportingManager() != null) {
            notificationService.sendNotification(emp.getReportingManager().getId(),
                    "New Travel Request",
                    emp.getFirstName() + " " + emp.getLastName() + " has submitted a travel request to " + request.getDestination(),
                    "TRAVEL", "TRAVEL_REQUEST", travel.getId());
        }

        return toResponse(travel);
    }

    @Override
    public TravelRequestResponse getById(Integer id) {
        return toResponse(travelRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found: " + id)));
    }

    @Override
    public PagedResponse<TravelRequestResponse> getMyRequests(String email, Pageable pageable) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        Page<TravelRequest> page = travelRequestRepository.findByEmployee(emp, pageable);
        return toPagedResponse(page);
    }

    @Override
    public PagedResponse<TravelRequestResponse> getAllRequests(Pageable pageable) {
        return toPagedResponse(travelRequestRepository.findAll(pageable));
    }

    @Override
    @Transactional
    public void cancelRequest(Integer id, String email) {
        TravelRequest tr = travelRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found: " + id));
        if (!tr.getEmployee().getUser().getEmail().equals(email)) {
            throw new BadRequestException("You can only cancel your own travel requests");
        }
        if (!"PENDING".equals(tr.getStatus())) {
            throw new BadRequestException("Only PENDING requests can be cancelled");
        }
        tr.setStatus("CANCELLED");
        travelRequestRepository.save(tr);
    }

    private TravelRequestResponse toResponse(TravelRequest t) {
        return TravelRequestResponse.builder()
                .id(t.getId())
                .employeeId(t.getEmployee().getEmployeeId())
                .employeeName(t.getEmployee().getFirstName() + " " + t.getEmployee().getLastName())
                .purpose(t.getPurpose())
                .destination(t.getDestination())
                .travelDate(t.getStartDate())
                .returnDate(t.getEndDate())
                .modeOfTransport(t.getModeOfTransport())
                .estimatedCost(t.getEstimatedCost())
                .actualCost(t.getActualCost())
                .additionalNotes(t.getAdditionalNotes())
                .status(t.getStatus())
                .currentApprover(workflowEngineService.getCurrentApprover("TRAVEL", t.getId()))
                .approverRemarks(workflowEngineService.getLatestRemarks("TRAVEL", t.getId()))
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private PagedResponse<TravelRequestResponse> toPagedResponse(Page<TravelRequest> page) {
        return PagedResponse.<TravelRequestResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .first(page.isFirst()).last(page.isLast()).build();
    }
}
