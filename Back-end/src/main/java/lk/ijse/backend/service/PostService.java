package lk.ijse.backend.service;

import lk.ijse.backend.dto.PostDTO;
import lk.ijse.backend.dto.ReactionDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

public interface PostService {
    int createPost(PostDTO postDTO);

    Page<PostDTO> getProfilePosts(String email, PageRequest pageable);

    String addReaction(int postId, ReactionDTO reactionDTO, String email);
}
