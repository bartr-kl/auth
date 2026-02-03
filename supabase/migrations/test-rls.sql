CREATE OR REPLACE FUNCTION has_role(p text)
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT p = ANY(current_setting('app.roles')::text[]);
$$;

drop table if exists reservations cascade;

create table reservations (
  id serial primary key,
  location_id varchar(50) not null,
  user_id int not null,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

insert into reservations (location_id, user_id, name, starts_at, ends_at) values
('picklr-west-austin', 13, '50+ Open Play', current_date -1 + time '18:00', current_date -1 + time '20:00'),
('picklr-west-austin', 13, '50+ Open Play', current_date +1 + time '18:00', current_date +1 + time '20:00'),
('picklr-west-austin', 13, '50+ Open Play', current_date +3 + time '18:00', current_date +3 + time '20:00'),
('picklr-west-austin', 13, '50+ Open Play', current_date +5 + time '18:00', current_date +5 + time '20:00'),
('picklr-west-austin', 13, '50+ Open Play', current_date +7 + time '18:00', current_date +7 + time '20:00'),
('picklr-west-austin', 13, '50+ Open Play', current_date +9 + time '18:00', current_date +9 + time '20:00'),
('picklr-west-austin', 14, '50+ Open Play', current_date -1 + time '18:00', current_date -1 + time '20:00'),
('picklr-west-austin', 14, '50+ Open Play', current_date +1 + time '18:00', current_date +1 + time '20:00'),
('picklr-west-austin', 14, '50+ Open Play', current_date +3 + time '18:00', current_date +3 + time '20:00'),
('picklr-west-austin', 14, '50+ Open Play', current_date +5 + time '18:00', current_date +5 + time '20:00');

CREATE POLICY reservations_select
ON reservations
FOR SELECT
USING (
    -- Tenant isolation always
    location_id = current_setting('app.location_id')::varchar

    AND
    (
        has_role('admin') or has_role('staff')

        OR

        user_id = current_setting('app.user_id')::int
    )
);

CREATE POLICY reservations_delete
ON reservations
FOR DELETE
USING (
  -- Always enforce tenant isolation
  location_id = current_setting('app.location_id')::varchar(50)

  AND
  (
    has_role('admin')


    OR

    (
      has_role('staff')
      AND starts_at > now()
    )

    OR

    (
      user_id = current_setting('app.user_id')::integer
      AND starts_at >= now() + interval '24 hours'
    )
  )
);

select * from reservations;

-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'reservations';

-- SELECT schemaname, tablename, policyname FROM pg_policies order by 1, 2, 3
