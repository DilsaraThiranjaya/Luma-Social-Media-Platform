//package lk.ijse.backend.service.impl;
//
//import lk.ijse.backend.dto.PostDTO;
//import lk.ijse.backend.entity.*;
//import lk.ijse.backend.repository.PostRepository;
//import lk.ijse.backend.repository.UserRepository;
//import lk.ijse.backend.service.TimelineService;
//import lk.ijse.backend.util.VarList;
//import lombok.RequiredArgsConstructor;
//import org.modelmapper.ModelMapper;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.stream.Collectors;
//
//@Service
//@Transactional
//@RequiredArgsConstructor
//public class TimelineServiceImpl implements TimelineService {
//    private final PostRepository postRepository;
//    private final UserRepository userRepository;
//    private final ModelMapper modelMapper;
//
//    @Override
//    public int savePost(PostDTO postDTO) {
//        try {
//            Post post = modelMapper.map(postDTO, Post.class);
//            post.setCreatedAt(LocalDateTime.now());
//            postRepository.save(post);
//            return VarList.Created;
//        } catch (Exception e) {
//            return VarList.Bad_Request;
//        }
//    }
//
//    @Override
//    public List<PostDTO> getTimelinePosts(String userEmail) {
//        User user = userRepository.findByEmail(userEmail);
//        List<Post> posts = postRepository.findTimelinePostsByUser(user);
//        return posts.stream()
//                .map(post -> modelMapper.map(post, PostDTO.class))
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public boolean addReaction(Integer postId, String userEmail, String reactionType) {
//        try {
//            Post post = postRepository.findById(postId).orElse(null);
//            User user = userRepository.findByEmail(userEmail);
//
//            if (post != null && user != null) {
//                Reaction reaction = new Reaction();
//                reaction.setUser(user);
//                reaction.setPost(post);
//                reaction.setType(Reaction.ReactionType.valueOf(reactionType));
//                reaction.setCreatedAt(LocalDateTime.now());
//
//                post.getReactions().add(reaction);
//                postRepository.save(post);
//                return true;
//            }
//            return false;
//        } catch (Exception e) {
//            return false;
//        }
//    }
//
//    @Override
//    public boolean addComment(Integer postId, String userEmail, String content) {
//        try {
//            Post post = postRepository.findById(postId).orElse(null);
//            User user = userRepository.findByEmail(userEmail);
//
//            if (post != null && user != null) {
//                Comment comment = new Comment();
//                comment.setUser(user);
//                comment.setPost(post);
//                comment.setContent(content);
//                comment.setCreatedAt(LocalDateTime.now());
//
//                post.getComments().add(comment);
//                postRepository.save(post);
//                return true;
//            }
//            return false;
//        } catch (Exception e) {
//            return false;
//        }
//    }
//
//    @Override
//    public PostDTO sharePost(Integer postId, String userEmail, String shareMessage) {
//        try {
//            Post originalPost = postRepository.findById(postId).orElse(null);
//            User user = userRepository.findByEmail(userEmail);
//
//            if (originalPost != null && user != null) {
//                Post sharedPost = new Post();
//                sharedPost.setUser(user);
//                sharedPost.setContent(shareMessage);
//                sharedPost.setCreatedAt(LocalDateTime.now());
//                sharedPost.setPrivacy(Post.PrivacyLevel.PUBLIC);
//
//                postRepository.save(sharedPost);
//                return modelMapper.map(sharedPost, PostDTO.class);
//            }
//            return null;
//        } catch (Exception e) {
//            return null;
//        }
//    }
//}