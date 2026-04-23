-- Create notification triggers for post and comment likes.
-- These fire AFTER INSERT on forum_likes / forum_comment_likes and call
-- create_notification with type='like' so the app can display explicit text.

-- -----------------------------------------------------------------------
-- POST LIKE TRIGGER
-- -----------------------------------------------------------------------

create or replace function public.notify_on_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_owner uuid;
begin
  select author_id into v_post_owner
  from public.forum_posts
  where id = NEW.post_id;

  -- Only notify the post owner; never notify the liker about themselves.
  if v_post_owner is not null and v_post_owner <> NEW.user_id then
    perform public.create_notification(
      v_post_owner,   -- who receives the notification
      NEW.user_id,    -- actor (the person who liked)
      'like',
      'liked your post',
      NEW.post_id,
      'post'
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_post_like_notify on public.forum_likes;
create trigger on_post_like_notify
  after insert on public.forum_likes
  for each row execute function public.notify_on_post_like();

-- -----------------------------------------------------------------------
-- COMMENT LIKE TRIGGER
-- -----------------------------------------------------------------------

create or replace function public.notify_on_comment_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment_owner uuid;
  v_post_id uuid;
begin
  select author_id, post_id into v_comment_owner, v_post_id
  from public.forum_comments
  where id = NEW.comment_id;

  -- Only notify the comment owner; never notify the liker about themselves.
  if v_comment_owner is not null and v_comment_owner <> NEW.user_id then
    perform public.create_notification(
      v_comment_owner,  -- who receives the notification
      NEW.user_id,      -- actor (the person who liked)
      'like',
      'liked your comment',
      NEW.comment_id,
      'comment'
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_comment_like_notify on public.forum_comment_likes;
create trigger on_comment_like_notify
  after insert on public.forum_comment_likes
  for each row execute function public.notify_on_comment_like();
