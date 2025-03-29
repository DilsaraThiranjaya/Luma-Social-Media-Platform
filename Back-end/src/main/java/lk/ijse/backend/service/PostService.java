package lk.ijse.backend.service;

import lk.ijse.backend.dto.PostDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

public interface PostService {
    int createPost(PostDTO postDTO);

    Page<PostDTO> getPosts(String email, PageRequest pageable);
}
