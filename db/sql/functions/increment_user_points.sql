-- SQL function to atomically increment a user's total_points and return the new total

CREATE OR REPLACE FUNCTION public.increment_user_points(_user_id uuid, _delta int)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  new_total int;
BEGIN
  UPDATE users
  SET total_points = total_points + _delta
  WHERE id = _user_id
  RETURNING total_points INTO new_total;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN new_total;
END;
$$;
