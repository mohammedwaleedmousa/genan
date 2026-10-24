# Genan temporary password-only sign in (24 October 2026)

## Routes
- Customer: `/auth`
- Admin: `/mohammedadmin77/login`
- Passwords are managed and hashed by Supabase Auth (`auth.users`); **do not** store plaintext or a second password in `public.customers`.
- Both flows use a phone number and password. The admin form additionally supports email and password.
- A customer cannot become an admin by choosing a URL or changing user metadata. Only an authorized database administrator assigns `public.user_roles.role = 'admin'`.

## One-time setup for an admin
1. Create/sign in to a user with their personal phone at `/auth`, or create an email/password user under Supabase Dashboard → Authentication → Users. Do not add an admin role during public registration.
2. Verify the intended user's identity outside the application.
3. In Supabase SQL Editor, obtain the matching authenticated user ID by a trusted identifier, then assign the role using the SQL below. Replace the placeholder with the **verified** `auth.users.id`:
   ```sql
   insert into public.user_roles (user_id, role)
   values ('<verified-auth-user-uuid>'::uuid, 'admin'::public.app_role)
   on conflict (user_id, role) do nothing;
   ```
4. Sign out and sign in at the admin route with the same phone/email and password.
5. Verify a normal customer user cannot open `/mohammedadmin77`, or call admin database operations.

## Pilot limitations
- This **temporarily skips phone ownership proof**. An unverified user could register another person's phone number. **Do not open payments, orders containing personal information, or general public signups before replacing this with phone OTP or an alternative verification method.**
- Supabase service-role key is used ONLY within a Supabase Edge Function, never shipped to browser, GitHub, or Cloudflare.
- Signup is rate-limited per IP/phone, but IP throttling alone is not a substitute for CAPTCHA and verification.
- `customer-password-register` requires `verify_jwt = false` because it is a public registration endpoint. Update `ALLOWED_ORIGINS` in the Supabase function secrets for any custom production domain; the default origin is `https://genan.pages.dev`.
- For customers registered before this change, legacy migration remains available on login.

## Deployment
1. Apply `supabase/migrations/20261024150000_genan_password_auth_pilot.sql` to Genan Prod only once.
2. Deploy `customer-password-register` with JWT verification disabled.
3. Build/deploy the frontend (Cloudflare Pages production branch: main).
4. Test an ordinary customer signup, logout, login, invalid password, and an admin authorization denial. Then add an authorized admin and retest.
5. Before launch: enable phone verification and require MFA for admins again.
