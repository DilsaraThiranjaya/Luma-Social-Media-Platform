//package lk.ijse.backend.service.impl;
//
//import io.agora.media.RtcTokenBuilder;
//import lk.ijse.backend.dto.CallDTO;
//import lk.ijse.backend.dto.UserDTO;
//import lk.ijse.backend.entity.User;
//import lk.ijse.backend.repository.UserRepository;
//import lk.ijse.backend.service.CallService;
//import lombok.RequiredArgsConstructor;
//import org.modelmapper.ModelMapper;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//
//@Service
//@RequiredArgsConstructor
//public class CallServiceImpl implements CallService {
//    private final UserRepository userRepository;
//    private final ModelMapper modelMapper;
//
//    @Value("${agora.app.id}")
//    private String appId;
//
//    @Value("${agora.app.certificate}")
//    private String appCertificate;
//
//    @Override
//    public CallDTO generateToken(String userEmail, CallDTO request) {
//        User user = userRepository.findByEmail(userEmail);
//
//        // Generate Agora token
//        RtcTokenBuilder token = new RtcTokenBuilder();
//        int timestamp = (int)(System.currentTimeMillis() / 1000 + 3600);
//
//        String channelName = request.getChannelName();
//        int uid = request.getUid();
//
//        String generatedToken = token.buildTokenWithUid(
//                appId,
//                appCertificate,
//                channelName,
//                uid,
//                RtcTokenBuilder.Role.Role_Publisher,
//                timestamp
//        );
//
//        request.setToken(generatedToken);
//        request.setCaller(modelMapper.map(user, UserDTO.class));
//
//        return request;
//    }
//}