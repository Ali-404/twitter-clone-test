import { useEffect, useRef, useState } from "react";
import { buttonClass, inputClass } from "../data/classes";
import TextAreaWithEllipsis from "./TextAreaWithEllips";
import UserProfileImg from "./UserProfileImg";
import axiosClient, { getUserById } from "../axios";
import { formatDate, timeAgo } from "../data/usefull";
import { useSelector } from "react-redux";

export default function Post({postData}) {

  const {  user } = useSelector((state) => state.auth)

  const [commentsShown, setCommentShowns] = useState(false)
  const [poster, setPoster] = useState(false)


  const [vues, setVues ] = useState([])
  const [comments, setComments ] = useState([])
  const [likes, setLikes ] = useState([])

  const [isLikedByClient, setIsLikedByClient] = useState(false)

  const postRef = useRef(null)

  const likeFunc = async () => {
    await axiosClient.post(`/likes/like/${postData.id}`, {
      likerId: user.id 
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    }).then(res => {
      const theLike  = res.data.like
      if (typeof(theLike) == "object" ){
        setLikes(prev => [...prev, theLike])
        setIsLikedByClient(true)

      }else {
        setIsLikedByClient(false)
        // fix prob here

        setLikes(prev => prev.filter(l =>  l.likerId != user.id))
      }

    }).catch(e => console.error(e))
  }

  const incrementViews = async () => {
    await axiosClient.post("vues/add",{
      postId:postData.id,
      viewerId:user.id
    },{
      headers:{
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    }).then((res) => {
      setVues((prev) => [...prev,res.data])
    }).catch(e => console.warn(e))
  }


  const createComment = async (commentContent) => {
    await axiosClient.post("comments/comment/add", {
      postId: postData.id,
      content: commentContent
    },{
      headers:{
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    }).then(res => {
     
      setComments(prev => [...prev, res.data.comment])
    }).catch(e => console.error(e))
  }

  const loadComments = async () => {
    await axiosClient.get(`/comments/${postData.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    }).then(res => {
      setComments(res.data ?? []);
    }).catch(e => console.error(e))
  }

  
 

  useEffect(() => {
    let hasBeenViewed = false;
  
    // Load poster and likes as before
    getUserById(postData.posterId).then(res => setPoster(res.data));



    axiosClient.get(`/vues/${postData.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    }).then(res => setVues(res.data ?? []));
    
    axiosClient.get(`/likes/${postData.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    }).then(res => {
      const clientLikes = res.data.filter(like => like.likerId == user.id) ?? [];
      setIsLikedByClient(clientLikes.length > 0);
      setLikes(res.data ?? []);
    });


    // load comments
    loadComments()
  
    // ================================= VUES COUNTER OBSERVER
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenViewed) {
            incrementViews();
            hasBeenViewed = true; // Prevent multiple increments
            observer.disconnect(); // Disconnect after incrementing
          }
        });
      },
      { threshold: 0.5 } // The element must be 50% visible in the viewport
    );
  
    const currentEl = postRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }
  
    // Clean up observer
    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [postData.posterId, postData.id, user.id]);

  if (!poster) return <div>Loading ...</div>

  return (
    <div onMouseEnter={incrementViews} className="p-4  rounded-md shadow-md bg-slate-50 flex flex-col  w-[95%] md:w-[60%] gap-4" >

      <div className="flex gap-2">
            
            <UserProfileImg url={poster.profile_img} letter={poster.username[0]} />
     

            <div className="text-sm flex flex-col items-start" ref={postRef}>
            {user.username != poster.username ? (
              <h1>{poster.firstName ? poster.firstName + " " + poster.lastName : "@"+poster.username}  </h1>

            ) : (
              <h1>You</h1>
            )}
                <small className="text-orange-400">{formatDate(postData.createdAt)} </small>
            </div>

      </div>

      <div>

    {/* !! todo */}
      {/* <img src="https://encrypted-tbn3.gstatic.com/licensed-image?q=tbn:ANd9GcS-_ycPMliqwjkLSNXt6aMeqPUvYxmz2NJ_PwgLJXxNuuEkQN8H5VApnN0r_vX3KMwMpebw3_EA5sNJHAo" className="w-[100%] object-contain rounded-md shadow" /> */}

      <TextAreaWithEllipsis text={postData.content} />
            

      <hr className="w-full" /> 
      </div>


        {/* tools */}
      <div className="flex items-center gap-4 text-sm justify-between"> 
            <div className="flex items-center gap-2">
                <span className={`flex items-center text-center gap-1 ${isLikedByClient ? "text-orange-500" : "text-emerald-300"}`}>
                    <button onClick={likeFunc} className={`material-icons `}>
                        {isLikedByClient ? "favorite" : "favorite_outline" }
                    </button>
                    {likes.length ?? 0}
                </span>

                <span className="flex items-center text-center gap-1 text-emerald-400">
                    <button onClick={() => setCommentShowns(o => !o)} className="material-icons text-emerald-400">
                        comment
                    </button>
                    {comments.length ?? 0}
                 </span>

        </div>

        <span className="flex items-center text-center gap-1 text-orange-400">
            <button className="material-icons text-orange-400">
                visibility
            </button>
            {vues.length ?? 0} 
        </span>

       



      </div>
        
      <div className="max-h-[400px] flex flex-col overflow-auto p-3">
        <div className="text-sm flex items-center gap-2"><h5>Comments</h5> <button onClick={() => setCommentShowns(o => !o)} className="material-icons text-sm">visibility{ !commentsShown && "_off" }</button> </div>
        <hr />
        
        {commentsShown && (
          <UserCommentInput createComment={createComment} />
        )}
        
        
        {commentsShown && (
          <>
          {comments && comments.length > 0 ? (
          <>
          
            <>
            {comments.map((comment,k) => <Comment key={k} client={user} commentData={comment} />)}
            
            </>
        
          
          
          </>
        )

          : (
            <div className="text-center text-sm">There is no comment here yet.</div>
          )

        } 
          </>
        )}
        
        

      </div>
    </div>
  )
}




// extra components
const UserCommentInput = ({createComment}) => {
  const {user} = useSelector(state => state.auth)
  const inputRef = useRef(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    const content = inputRef.current.value
    await createComment(content)
    inputRef.current.value = ""
    return false
  }

  return (
    <form onSubmit={onSubmit}  className="flex gap-4 py-5">
      
      <UserProfileImg url={user.profile_img} letter={user.username[0]} w="44px" />
      <input ref={inputRef}  required className={inputClass + " border-none placeholder:text-sm" } placeholder="Add you comment .."  />
    </form>
  )
}


const Comment = ({commentData, client}) => {
  const commentUser = commentData?.user
  return (
    <div className="flex gap-4 py-5 ">
      
      <UserProfileImg url={commentUser.profile_img} letter={commentUser.username[0]} w="40px" />
     
     <div>
     {/* infos */}
        <div className="flex gap-2 items-center">
        {commentUser.id != client.id ? (
          <span className="font-bold">{commentUser.firstName ? commentUser.firstName + " " + commentUser.lastName : "@" + commentUser.username}</span>
          
        ) : (<span className="font-bold">YOU</span>) }
          <small className="bg-orange-200 rounded-md shadow-md px-1 italic opacity-70">{timeAgo(commentData.createdAt)}</small>
          
          {/* spacer */}
          <div className="flex-1"></div>
          {commentUser.id == client.id && (
          <button >
            <i  className="material-icons text-md text-orange-300">delete</i>
          </button>
          )}
        </div>
        {/* comment */}
        <p className="text-sm">{commentData.content}</p>
     </div>



    </div>
  )
}