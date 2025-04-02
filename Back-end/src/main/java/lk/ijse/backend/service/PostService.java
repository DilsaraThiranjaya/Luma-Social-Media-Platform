package lk.ijse.backend.service;

import lk.ijse.backend.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PostService {
    int createPost(PostDTO postDTO);

    Page<PostDTO> getProfilePosts(String email, PageRequest pageable);

    ResponseDTO addReaction(int postId, ReactionDTO reactionDTO, String email);


    PostDTO getPost(int postId, String email) throws Exception;

    void deletePost(int postId) throws Exception;

    PostDTO updatePost(int postId, String email, PostUpdateDTO updateDTO);

    @Transactional
    ReportDTO createReport(ReportRequestDTO reportRequest, String reporterEmail);

    CommentDTO addComment(int postId, CommentDTO commentDTO, String email);

    Page<PostDTO> getTimelinePosts(String email, PageRequest pageable);

    void deleteComment(int commentId, String email);

    CommentDTO addReply(int parentCommentId, CommentDTO commentDTO, String email);

    List<PostDTO> searchPosts(String query, int limit, String email);

    Page<PostDTO> getUserProfilePosts(int userId, PageRequest pageable);
}
