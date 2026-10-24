# GENAN — password-based authentication setup (October 2026)

## Access points
- Customer: https://genan.pages.dev/auth
- Admin: https://genan.pages.dev/mohammedadmin77/login

The public paths are only page routes. **They do not grant admin access.** Every admin session must pass `public.is_current_user_admin()` and the server-side role/permission policies.

## Customer accounts (phone + password, no OTP UI)
The storefront already registers through `supabase.auth.signUp({ phone, password })` and authenticates via `signInWithPassword`. Supabase Auth stores password hashes; public customer records store the customer profile keyed by `user_id`. **Never store plaintext passwords in `public.customers`.**

For password-only phone registration, project owner must verify the following in **Supabase → Authentication → Providers → Phone**:
1. Phone signup is enabled.
2. Phone confirmation is **disabled** for this temporary password-only flow. If confirmation remains enabled, Supabase requires SMS verification and the current UI cannot finish signup without it.
3. Test a new phone/password signup in an authorized test account, confirm the row in **Authentication → Users** and `public.customers`, sign out and sign in again. Never bypass server-side customer ownership checks.

Phone-only authentication without verification has an account-impersonation risk (someone can initially register a number they do not own). Enable verified phone ownership before launching publicly. This configuration is for a limited prototype.

## First admin (manual, privileged action)
As of 2026-10-24, **Genan Prod had no Auth users and no admin roles**; no admin credentials exist to distribute. Do NOT allow public admin self-registration or grant a role based on client-submitted metadata.

1. **Supabase → Authentication → Users → Add user**: create the intended administrator using their chosen email and strong, unique password. Confirm the email using the controlled admin workflow (do not ask for passwords in a chat).
2. Confirm the user was created and copy their ID or use the exact email in the following SQL. Run in **Supabase SQL Editor** as a project owner, replacing the placeholder.
3. **Grant the admin role only to the account that you have verified belongs to the store owner**:

```sql
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users as u
where lower(u.email) = lower('YOUR_ADMIN_EMAIL@example.com')
on conflict (user_id, role) do nothing;
```

4. Verify the role exists and is assigned to the right user (do not return password hashes):

```sql
select u.email, r.role
from public.user_roles as r
join auth.users as u on u.id = r.user_id
where r.role = 'admin'::public.app_role;
```

5. Visit the admin login page and sign in with **email + password only**. Non-admin credentials must fail access. Confirm a customer cannot open any protected admin route.

## Admin MFA compatibility
The password-only admin UI does not enroll or challenge for TOTP. Existing database policies may still require `aal2` for accounts that **already enrolled a verified TOTP factor**. Do not weaken that database protection; such users should have factors unenrolled through a privileged/verified recovery process before using password-only login. At the time of this change, the new Genan database had **zero** Auth users, so this does not block newly created admin users.

## Deployment verification
- Changes must be merged into `main` and deployed from Cloudflare Pages (`npm run build`, `dist`).
- Check the admin route works on the deployed domain and its password form renders without QR/OTP input.
- Check customer registration succeeds without OTP only if the Phone provider configuration above is correct.
- Confirm `Authentication → Users`, customer rows, and admin role match; do not mark an untested flow as production-ready.
