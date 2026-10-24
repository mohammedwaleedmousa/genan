# Genan: temporary phone + password login pilot (24 October 2026)

## Login routes
- Customer: `/auth` (local phone + international dial code, password)
- Admin: `/mohammedadmin77/login` (email **or** E.164 phone, password)
- Supabase Auth manages the salted password hashes in its private `auth.users` data; no plaintext passwords are saved in `public.customers`.
- No OTP forms or Google Authenticator challenge are required during this pilot. Admin users STILL require a trusted `public.user_roles` assignment.

## IMPORTANT: hosted Auth setting
No server-side auto-confirm user creation endpoint is deployed. To use password-only phone registration, configure Genan Prod Supabase Dashboard → Authentication → Providers → Phone. Enable phone authentication and, **only while testing**, disable required SMS phone confirmation if the provider/settings support it. If a Supabase-managed project does not permit no-verification phone registration, signup must remain blocked rather than silently bypassing verification.

The frontend will clearly explain when a new account needs server-side confirmation settings changed. The sign-in form itself never sends an OTP.

## Create an administrator after identity verification
The database was inspected on 2026-10-24: zero admin roles exist.
1. First create a phone/password user on the customer page, **or** create an email/password user under Supabase Dashboard → Authentication → Users.
2. Verify the identity of the intended admin out of band.
3. Grant the `admin` role to the verified account ID from `auth.users`:
   ```sql
   insert into public.user_roles (user_id, role)
   values ('<VERIFIED_AUTH_USER_UUID>'::uuid, 'admin'::public.app_role)
   on conflict (user_id, role) do nothing;
   ```
4. Log in via `/mohammedadmin77/login`. A normal customer must fail admin permission checks.

Do not grant admin roles by trusting user-submitted metadata or client code.

## Security and readiness
- Skipping phone possession verification permits number spoofing / accidental number squatting. This is **not** safe as a public customer launch.
- Require verified phone ownership and admin MFA before accepting live orders or sensitive personal information.
- The SQL migration tightens an existing admin permission gate so a non-admin cannot pass admin-only RLS policies.
- No Supabase service-role key is ever exposed in the frontend or GitHub.

## Verification
1. Open `/auth`; test new customer creation, correct password login, wrong password denial and logout.
2. Open `/mohammedadmin77/login`; confirm a non-admin is refused.
3. Grant the admin role to one *verified* user; confirm login with email/phone and password.
4. Check admin data access is rejected when there is no admin role, and allowed for valid staff.
5. Run `npm run verify:critical-flows`, `npm run build`, and Cloudflare preview smoke tests.
