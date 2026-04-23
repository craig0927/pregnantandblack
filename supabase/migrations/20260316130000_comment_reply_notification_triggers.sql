-- Notification triggers for comments and replies on forum posts.
-- A top-level comment notifies the post author.
-- A reply notifies the parent comment's author.

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_author    uuid;
  v_parent_author  uuid;
begin
  if NEW.parent_comment_id is null then
    -- Top-level comment: notify the post author.
    select author_id into v_post_author
    from public.forum_posts
    where id = NEW.post_id;

    if v_post_author is not null and v_post_author <> NEW.author_id then
      perform public.create_notification(
        v_post_author,
        NEW.author_id,
        'comment',
        'commented on your post',
        NEW.post_id,
        'post'
      );
    end if;
  else
    -- Reply: notify the parent comment's author.
    select author_id into v_parent_author
    from public.forum_comments
    where id = NEW.parent_comment_id;

    if v_parent_author is not null and v_parent_author <> NEW.author_id then
      perform public.create_notification(
        v_parent_author,
        NEW.author_id,
        'reply',
        'replied to your comment',
        NEW.id,
        'comment'
      );
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_comment_notify on public.forum_comments;
create trigger on_comment_notify
  after insert on public.forum_comments
  for each row execute function public.notify_on_comment();
