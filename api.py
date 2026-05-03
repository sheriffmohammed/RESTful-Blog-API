from fastapi import FastAPI, HTTPException, status, Depends
from db_utils import Session_dep
from db import (Post, User, PostCreate, EditPost, Token, TokenData, Comment, PostOut, CommentOut,
                EditUserData, LikeOut, UserOut, PostComment, Like, UsersWhoLiked,
                UserIn, PostFeed, CommentFeed)
from datetime import datetime, timedelta, timezone
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pwdlib import PasswordHash
import jwt
from jwt.exceptions import InvalidTokenError
from typing import Annotated
from sqlmodel import select, func
from dotenv import load_dotenv
import os
import logging

logger = logging.getLogger(__name__)
load_dotenv()
SECRET = os.getenv("API_SECRET_KEY")
if not SECRET:
    logger.error("SECRET_KEY environment variable is not set")
    raise ValueError("SECRET_KEY environment variable is not set")
SECRET_KEY = SECRET
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")
app = FastAPI(title="blogging-api")
DUMMY_HASH = password_hash.hash("dummy-password")


def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)


def hash_password(plain_password):
    return password_hash.hash(plain_password)


def get_user(username, session):
    statement = select(User).where(User.user_name == username)
    user = session.exec(statement).first()
    if user:
        return user


def authenticate_user(user_name, password, session):
    user = get_user(user_name, session)
    if not user:
        verify_password(password, DUMMY_HASH)
        return None
    if not verify_password(password, user.password):
        return None
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_active_user_from_token(token: Annotated[str, Depends(oauth2_scheme)], session: Session_dep):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise InvalidTokenError
        token_data = TokenData(user_name=username)
    except InvalidTokenError:
        raise credentials_exception
    user = get_user(token_data.user_name, session)
    if not user:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_active_user_from_token)],
):
    return current_user


@app.get("/posts/", response_model=list[PostFeed])
def get_posts(session: Session_dep, skip: int = 0, limit: int = 10):
    statement = (
        select(Post, User.user_name, func.count(Like.id).label("likes_count"), User.photo_path)
        .join(User, Post.user_id == User.id)  # type: ignore
        .outerjoin(Like, Like.post_id == Post.post_id)  # outer-join so posts with 0 likes still show
        .group_by(Post.post_id)
        .offset(skip)
        .limit(limit)
    )

    posts = session.exec(statement).all()
    if not posts:
        return []
    return [PostFeed(**post_data.model_dump(), user_name=user_name,
                     likes_count=likes, user_photo=photo)
            for post_data, user_name, likes, photo in posts]


@app.get("/user-posts/{user_id}", response_model=list[PostFeed] | None)
def get_user_posts(user_id: int, session: Session_dep, skip: int = 0, limit: int = 10):
    statement = (
        select(Post, User.user_name, func.count(Like.id).label("likes_count"), User.photo_path)
        .join(User, Post.user_id == User.id)  # type: ignore
        .outerjoin(Like, Like.post_id == Post.post_id)  # Outer-join so posts with 0 likes still show
        .where(Post.user_id == user_id)
        .group_by(Post.post_id)
        .offset(skip)
        .limit(limit)
    )
    posts = session.exec(statement).all()
    if not posts:
        return []
    result = [PostFeed(**post_data.model_dump(), user_name=user_name,
                       likes_count=likes, user_photo=photo)
              for post_data, user_name, likes, photo in posts]
    return result


@app.get("/get-post/{post_id}", response_model=PostFeed | None)
def get_post(post_id: int, session: Session_dep):
    statement = (
        select(Post, User.user_name, func.count(Like.id).label("likes_count"), User.photo_path)
        .join(User, Post.user_id == User.id)  # type: ignore
        .outerjoin(Like, Like.post_id == Post.post_id)
        .where(Post.post_id == post_id)
        .group_by(Post.post_id)
    )

    post = session.exec(statement).first()
    if not post:
        return None
    post_data, user_name, likes_count, photo = post
    result = PostFeed(**post_data.model_dump(), user_name=user_name,
                      likes_count=likes_count, user_photo=photo)
    return result


@app.get("/comments/{post_id}", response_model=list[CommentFeed] | None)
def get_comments(post_id: int, session: Session_dep):
    statement = ((select(Comment, User.user_name, func.count(Like.id).label("comment_likes"),
                         User.photo_path)
                 .join(User, Comment.user_id == User.id)  # type: ignore
                 .outerjoin(Like, Like.comment_id == Comment.comment_id)
                 .where(Comment.post_id == post_id))
                 .group_by(Comment.comment_id))
    comments = session.exec(statement).all()
    if not comments:
        return []

    return [CommentFeed(**comments_data.model_dump(), user_name=user_name,
                        likes_count=likes_count, user_photo=photo)
            for comments_data, user_name, likes_count, photo in comments]


@app.get("/users-who-liked-post/{post_id}", response_model=list[UsersWhoLiked])
def get_users_who_liked_post(post_id: int, session: Session_dep):
    statement = ((select(Like, User.id, User.user_name, User.photo_path)
                 .join(User, Like.user_id == User.id))  # type:ignore
                 .where(Like.post_id == post_id))
    result = session.exec(statement).all()
    if not result:
        return []
    return [UsersWhoLiked(user_id=user_id, user_name=user_name, user_photo=user_photo)
            for _, user_id, user_name, user_photo in result]


@app.get("/users-who-liked-comment/{comment_id}", response_model=list[UsersWhoLiked])
def get_users_who_liked_comment(comment_id: int, session: Session_dep):
    statement = ((select(Like, User.id, User.user_name, User.photo_path)
                 .join(User, Like.user_id == User.id))  # type:ignore
                 .where(Like.comment_id == comment_id))
    result = session.exec(statement).all()
    if not result:
        return []
    return [UsersWhoLiked(user_id=user_id, user_name=user_name, user_photo=user_photo)
            for _, user_id, user_name, user_photo in result]


@app.get("/me/", response_model=UserOut)
def me(current_user: Annotated[User, Depends(get_current_active_user)]):
    return current_user


@app.post("/login", response_model=Token)
async def login_for_access_token(
        form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: Session_dep) -> Token:
    user = authenticate_user(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token({"sub": user.user_name}, access_token_expires)
    return Token(access_token=access_token, token_type="bearer")


@app.post("/register/", status_code=status.HTTP_201_CREATED, response_model=dict)
def register(user: UserIn, session: Session_dep):
    user.password = hash_password(user.password)
    try:
        db_user = User.model_validate(user)
        session.add(db_user)
        session.commit()
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"user creation failed")
    return_dict = {"user_name": user.user_name, "email": user.email, "created_at": datetime.now()}
    return return_dict


@app.post("/post/", response_model=PostOut)
def add_post(post: PostCreate, session: Session_dep,
             current_user: Annotated[User, Depends(get_current_active_user)]):
    try:
        db_post = Post.model_validate(post, update={"user_id": current_user.id})
    except Exception as e:
        logger.error(f"Post creation error: {e}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Posting failed")

    try:
        session.add(db_post)
        session.commit()
        session.refresh(db_post)
    except Exception as e:
        logger.error(f"Post creation error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="adding post failed")
    return db_post


@app.post("/comment/{post_id}", response_model=CommentOut)
def add_comment(comment: PostComment, post_id: int, session: Session_dep,
                current_user: Annotated[User, Depends(get_current_active_user)]):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db_comment = Comment.model_validate(comment, update={"user_id": current_user.id, "post_id": post_id})
    session.add(db_comment)
    session.commit()
    session.refresh(db_comment)
    return db_comment


@app.post("/like-post/{post_id}", response_model=LikeOut)
def like_post(post_id: int, session: Session_dep,
              current_user: Annotated[User, Depends(get_current_active_user)]):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    statement = select(Like).where(Like.user_id == current_user.id, Like.post_id == post_id)
    like = session.exec(statement).first()
    if like:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="already liked this post")
    db_like = Like(post_id=post_id, user_id=current_user.id)
    session.add(db_like)
    session.commit()
    session.refresh(db_like)
    return db_like


@app.post("/like-comment/{comment_id}", response_model=LikeOut)
def like_comment(comment_id: int, session: Session_dep,
                 current_user: Annotated[User, Depends(get_current_active_user)]):
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="comment not found")
    statement = select(Like).where(Like.user_id == current_user.id, Like.comment_id == comment_id)
    like = session.exec(statement).first()
    if like:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="already liked this comment")
    db_like = Like(comment_id=comment_id, user_id=current_user.id)
    session.add(db_like)
    session.commit()
    session.refresh(db_like)
    return db_like


@app.delete("/delete-post/{post_id}", response_model=dict)
def delete_post(post_id: int, session: Session_dep,
                current_user: Annotated[User, Depends(get_current_active_user)]):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="post not found")
    if not current_user.id == post.user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="no authorization")
    session.delete(post)
    session.commit()
    return {"msg": "post successfully deleted"}


@app.delete("/delete-comment/{comment_id}", response_model=dict)
def delete_comment(comment_id: int, session: Session_dep,
                   current_user: Annotated[User, Depends(get_current_active_user)]):
    db_comment = session.get(Comment, comment_id)
    if not db_comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="comment not found")
    if not db_comment.user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="no authorization")
    session.delete(db_comment)
    session.commit()
    return {"msg": "comment deleted"}


@app.delete("/delete-like-post/{post_id}", response_model=dict)
def delete_like_post(post_id: int, session: Session_dep,
                     current_user: Annotated[User, Depends(get_current_active_user)]):
    statement = select(Like).where(Like.user_id == current_user.id, Like.post_id == post_id)
    like = session.exec(statement).first()
    if not like:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="like not found")
    session.delete(like)
    session.commit()
    return {"msg": "post unliked"}


@app.delete("/delete-like-comment/{comment_id}", response_model=dict)
def delete_like_comment(comment_id: int, session: Session_dep,
                        current_user: Annotated[User, Depends(get_current_active_user)]):
    statement = select(Like).where((Like.user_id == current_user.id) & (Like.comment_id == comment_id))
    like = session.exec(statement).first()
    if not like:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="comment must be liked to delete the like")
    session.delete(like)
    session.commit()
    return {"msg": "comment unliked"}


@app.patch("/edit-comment/{comment_id}", response_model=CommentOut)
def edit_comment(comment_id: int, session: Session_dep,
                 current_user: Annotated[User, Depends(get_current_active_user)], content: str | None = None):
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="comment not found")
    if not comment.user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="no authorization")
    if content:
        comment.content = content
        comment.modified_at = datetime.now()
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment


@app.patch("/update-post/{post_id}", response_model=PostOut)
def update_post(post_id: int, data: EditPost, session: Session_dep,
                current_user: Annotated[User, Depends(get_current_active_user)]):

    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="no such post in the database")
    if not post.user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="no authorization")

    db_post = data.model_dump(exclude_unset=True)
    for k, v in db_post.items():
        setattr(post, k, v)
    post.modified_at = datetime.now()
    session.add(post)
    session.commit()
    session.refresh(post)
    return post


@app.patch("/edit-user-data/", response_model=UserOut)
def edit_user_data(new_data: EditUserData, session: Session_dep,
                   current_user: Annotated[User, Depends(get_current_active_user)]):
    if new_data.password:
        new_data.password = hash_password(new_data.password)
    hashmap = new_data.model_dump(exclude_unset=True)
    for k, v in hashmap.items():
        setattr(current_user, k, v)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user
