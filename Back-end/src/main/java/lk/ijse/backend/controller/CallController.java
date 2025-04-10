//package lk.ijse.backend.controller;
//
//import lk.ijse.backend.dto.CallDTO;
//import lk.ijse.backend.dto.ResponseDTO;
//import lk.ijse.backend.service.CallService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.security.core.Authentication;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("api/v1/calls")
//@RequiredArgsConstructor
//public class CallController {
//    private final CallService callService;
//
//    @PreAuthorize("hasRole('USER')")
//    @PostMapping("/token")
//    public ResponseEntity<ResponseDTO> generateToken(
//            @RequestBody CallDTO callRequest,
//            Authentication authentication
//    ) {
//        try {
//            String userEmail = authentication.getName();
//            CallDTO callDTO = callService.generateToken(userEmail, callRequest);
//            return ResponseEntity.ok()
//                    .body(new ResponseDTO("200", "Call Token Generated Successfully!", callDTO));
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError()
//                    .body(new ResponseDTO("500", e.getMessage(), null));
//        }
//    }
//}