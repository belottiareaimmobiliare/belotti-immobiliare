do $$
declare
  first_property_id uuid;
  second_property_id uuid;
begin
  select id
  into first_property_id
  from public.properties
  order by created_at asc nulls last, title asc
  limit 1;

  select id
  into second_property_id
  from public.properties
  where id is distinct from first_property_id
  order by created_at asc nulls last, title asc
  limit 1;

  if first_property_id is not null then
    insert into public.property_owners (
      property_id,
      owner_type,
      role,
      full_name,
      email,
      phone,
      tax_code,
      address,
      city,
      province,
      notes,
      is_primary
    )
    select
      first_property_id,
      'person',
      'owner',
      'Mario Rossi',
      'mario.rossi.demo@email.it',
      '+39 333 111 2233',
      'RSSMRA70A01A794X',
      'Via Demo 12',
      'Bergamo',
      'BG',
      'Proprietario demo inserito per test AI-OS.',
      true
    where not exists (
      select 1
      from public.property_owners
      where property_id = first_property_id
        and full_name = 'Mario Rossi'
    );
  end if;

  if second_property_id is not null then
    insert into public.property_owners (
      property_id,
      owner_type,
      role,
      full_name,
      email,
      phone,
      tax_code,
      address,
      city,
      province,
      notes,
      is_primary
    )
    select
      second_property_id,
      'person',
      'owner',
      'Bruno Bianchi',
      'bruno.bianchi.demo@email.it',
      '+39 333 444 5566',
      'BNCBRN68B02A794Y',
      'Via Prova 24',
      'Bergamo',
      'BG',
      'Proprietario demo inserito per test AI-OS.',
      true
    where not exists (
      select 1
      from public.property_owners
      where property_id = second_property_id
        and full_name = 'Bruno Bianchi'
    );
  end if;
end $$;
