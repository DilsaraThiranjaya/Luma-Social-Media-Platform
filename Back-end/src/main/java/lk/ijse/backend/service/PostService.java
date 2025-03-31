package lk.ijse.backend.service;

import jakarta.validation.Valid;
import lk.ijse.backend.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

public interface PostService {
    int createPost(PostDTO postDTO);

    Page<PostDTO> getProfilePosts(String email, PageRequest pageable);

    ResponseDTO addReaction(int postId, ReactionDTO reactionDTO, String email);


    PostDTO getPost(int postId, String email) throws Exception;

    void deletePost(int postId) throws Exception;

    PostDTO updatePost(int postId, String email, PostUpdateDTO updateDTO);

    CommentDTO addComment(int postId, CommentDTO commentDTO, String email);

    ResponseDTO addCommentReaction(int commentId, ReactionDTO reactionDTO, String email);

    CommentDTO getComment(int parentCommentId);

    Page<PostDTO> getTimelinePosts(String email, PageRequest pageable);
}
