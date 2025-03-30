package lk.ijse.backend.service;

import lk.ijse.backend.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

public interface PostService {
    int createPost(PostDTO postDTO);

    Page<PostDTO> getProfilePosts(String email, PageRequest pageable);

    ResponseDTO addReaction(int postId, ReactionDTO reactionDTO, String email);

//    @Transactional
//    PostResponseDTO updatePost(int postId, String email, PostUpdateDTO postUpdateDTO);

    PostDTO getPost(int postId, String email) throws Exception;

    void deletePost(int postId) throws Exception;

}
