-- Drop existing triggers if they exist (we're switching to RPC approach)
DROP TRIGGER IF EXISTS increment_votes_on_insert ON public.votes;
DROP TRIGGER IF EXISTS decrement_votes_on_delete ON public.votes;

-- Create atomic vote function
CREATE OR REPLACE FUNCTION public.rpc_vote(p_artifact_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
  v_new_count integer;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if vote already exists
  SELECT EXISTS(
    SELECT 1 FROM votes 
    WHERE artifact_id = p_artifact_id AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN
    RETURN json_build_object('success', false, 'error', 'Already voted');
  END IF;

  -- Insert vote
  INSERT INTO votes (artifact_id, user_id)
  VALUES (p_artifact_id, v_user_id);

  -- Increment votes_count atomically
  UPDATE artifacts 
  SET votes_count = votes_count + 1 
  WHERE id = p_artifact_id
  RETURNING votes_count INTO v_new_count;

  RETURN json_build_object('success', true, 'votes_count', v_new_count);
END;
$$;

-- Create atomic unvote function
CREATE OR REPLACE FUNCTION public.rpc_unvote(p_artifact_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_deleted_count integer;
  v_new_count integer;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Delete vote if exists
  WITH deleted AS (
    DELETE FROM votes 
    WHERE artifact_id = p_artifact_id AND user_id = v_user_id
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted_count FROM deleted;

  IF v_deleted_count = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Vote not found');
  END IF;

  -- Decrement votes_count atomically (with floor at 0)
  UPDATE artifacts 
  SET votes_count = GREATEST(votes_count - 1, 0)
  WHERE id = p_artifact_id
  RETURNING votes_count INTO v_new_count;

  RETURN json_build_object('success', true, 'votes_count', v_new_count);
END;
$$;