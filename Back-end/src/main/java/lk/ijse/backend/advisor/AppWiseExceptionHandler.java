package lk.ijse.backend.advisor;

import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.util.VarList;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
@CrossOrigin
public class AppWiseExceptionHandler {

    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ResponseDTO> exceptionHandler(Exception ex) {
        log.error("Error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ResponseDTO(VarList.Internal_Server_Error, ex.getMessage(), null));
    }
}
