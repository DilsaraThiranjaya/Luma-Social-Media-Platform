package lk.ijse.backend.service;

import lk.ijse.backend.dto.PostDTO;
import java.util.List;

public interface TimelineService {
    int savePost(PostDTO postDTO);
    List<PostDTO> getTimelinePosts(String userEmail);
    boolean addReaction(Integer postId, String userEmail, String reactionType);
    boolean addComment(Integer postId, String userEmail, String content);
    PostDTO sharePost(Integer postId, String userEmail, String shareMessage);
}