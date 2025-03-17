package lk.ijse.backend.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/login")
@CrossOrigin(origins = "*")
public class LoginController {
    @GetMapping
    public String login(){
        return "Login";
    }
}
