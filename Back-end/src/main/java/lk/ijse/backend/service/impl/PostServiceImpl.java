package lk.ijse.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lk.ijse.backend.dto.PostDTO;
import lk.ijse.backend.dto.PostMediaDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.Post;
import lk.ijse.backend.entity.PostMedia;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.PostMediaRepository;
import lk.ijse.backend.repository.PostRepository;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.service.PostService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final ModelMapper modelMapper;

    @Transactional
    @Override
    public int createPost(PostDTO postDTO) {
        try {
            Post post = new Post();
            post.setContent(postDTO.getContent());
            post.setPrivacy(postDTO.getPrivacy());
            post.setUser(userRepository.findById(String.valueOf(postDTO.getUser().getUserId()))
                    .orElseThrow(() -> new EntityNotFoundException("User not found")));

            Post savedPost = postRepository.save(post);

            // Save media items
            if (postDTO.getMedia() != null && !postDTO.getMedia().isEmpty()) {
                List<PostMedia> mediaList = postDTO.getMedia().stream()
                        .map(mediaDTO -> {
                            PostMedia media = new PostMedia();
                            media.setMediaUrl(mediaDTO.getMediaUrl());
                            media.setMediaType(PostMedia.MediaType.valueOf(String.valueOf(mediaDTO.getMediaType())));
                            media.setPost(savedPost);
                            return media;
                        })
                        .collect(Collectors.toList());

                postMediaRepository.saveAll(mediaList);
            }

            return VarList.Created;
        } catch (Exception e) {
            return VarList.Bad_Request;
        }
    }

    @Override
    public Page<PostDTO> getPosts(String email, PageRequest pageRequest) {
        User currentUser = userRepository.findByEmail(email);
        if (currentUser == null) {
            throw new EntityNotFoundException("User not found");
        }

        Page<Post> posts = postRepository.findUsersVisiblePostsByUserId(
                currentUser.getUserId(),
                pageRequest
        );

        return posts.map(this::convertToDTO);
    }

    private PostDTO convertToDTO(Post post) {
        PostDTO postDTO = modelMapper.map(post, PostDTO.class);

        // Convert user
        postDTO.setUser(modelMapper.map(post.getUser(), UserDTO.class));

        // Convert media
        postDTO.setMedia(post.getMedia().stream()
                .map(media -> modelMapper.map(media, PostMediaDTO.class))
                .collect(Collectors.toList()));

        return postDTO;
    }
}
