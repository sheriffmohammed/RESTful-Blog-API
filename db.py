from sqlmodel import SQLModel, Field
from pydantic import EmailStr, BaseModel
from datetime import datetime
# uncomment below for tables creation
# from sqlmodel import create_engine
# from db_utils import DATABASE_URL


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: int | None = Field(default=None, primary_key=True)
    is_super_user: bool = False
    user_name: str = Field(unique=True, max_length=50)
    email: EmailStr = Field(unique=True, max_length=255)
    password: str = Field(min_length=8, max_length=255)
    photo_path: str | None = None


class Post(SQLModel, table=True):
    __tablename__ = "posts"

    post_id: int | None = Field(default=None, primary_key=True)
    content: str = Field(max_length=2000)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.now)
    modified_at: datetime = Field(default_factory=datetime.now)
    photo_path: str | None = None


class Comment(SQLModel, table=True):
    __tablename__ = "comments"

    comment_id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    post_id: int = Field(foreign_key="posts.post_id")
    created_at: datetime = Field(default_factory=datetime.now)
    modified_at: datetime = Field(default_factory=datetime.now)
    content: str = Field(max_length=1000)


class Like(SQLModel, table=True):
    __tablename__ = "likes"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    post_id: int | None = Field(default=None, foreign_key="posts.post_id")
    comment_id: int | None = Field(default=None, foreign_key="comments.comment_id")


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"
    id: int | None = Field(default=None, primary_key=True)
    token: str = Field(unique=True)
    user_id: int = Field(foreign_key="users.id")
    expires_at: datetime


class UserIn(BaseModel):
    user_name: str = Field(unique=True, max_length=50)
    email: EmailStr = Field(unique=True, max_length=255)
    password: str = Field(min_length=8, max_length=255)
    photo_path: str | None = None


class PostCreate(BaseModel):
    content: str
    photo_path: str | None = None


class EditPost(BaseModel):
    photo_path: str | None = Field(default=None)
    content: str | None = Field(default=None)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class RefreshRequest(SQLModel):
    refresh_token: str


class TokenData(BaseModel):
    user_name: str | None = None


class PostComment(BaseModel):
    content: str = Field(max_length=1000)


class EditUserData(BaseModel):
    user_name: str = Field(default=None, unique=True, max_length=50)
    email: EmailStr | None = Field(default=None, unique=True, max_length=255)
    photo_path: str | None = None
    password: str = Field(default=None, min_length=8, max_length=255)


class UserOut(BaseModel):
    id: int | None = Field(default=None, primary_key=True)
    user_name: str = Field(unique=True, max_length=50)
    email: EmailStr = Field(unique=True, max_length=255)
    photo_path: str | None = None


class PostOut(BaseModel):
    post_id: int | None = Field(default=None, primary_key=True)
    content: str = Field(max_length=2000)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.now)
    modified_at: datetime = Field(default_factory=datetime.now)
    photo_path: str | None = None


class CommentOut(BaseModel):
    comment_id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    post_id: int = Field(foreign_key="posts.post_id")
    created_at: datetime = Field(default_factory=datetime.now)
    modified_at: datetime = Field(default_factory=datetime.now)
    content: str = Field(max_length=1000)


class LikeOut(BaseModel):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    post_id: int | None = Field(default=None, foreign_key="posts.post_id")
    comment_id: int | None = Field(default=None, foreign_key="comments.comment_id")


class PostFeed(BaseModel):
    post_id: int | None = Field(default=None, primary_key=True)
    content: str = Field(max_length=2000)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.now)
    modified_at: datetime = Field(default_factory=datetime.now)
    photo_path: str | None = None
    likes_count: int = Field()
    user_name: str = Field(max_length=55)
    user_photo: str | None = Field()


class CommentFeed(BaseModel):
    comment_id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    post_id: int = Field(foreign_key="posts.post_id")
    created_at: datetime = Field(default_factory=datetime.now)
    modified_at: datetime = Field(default_factory=datetime.now)
    content: str = Field(max_length=1000)
    user_name: str = Field()
    likes_count: int = Field()
    user_photo: str | None = Field()


class UsersWhoLiked(BaseModel):
    user_id: int = Field(foreign_key="users.id")
    user_photo: str | None = None
    user_name: str = Field(unique=True, max_length=50)

# uncomment below for tables creation
# engine = create_engine(DATABASE_URL)
# SQLModel.metadata.create_all(engine)
