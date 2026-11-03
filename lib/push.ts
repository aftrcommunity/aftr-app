// Public half of the key pair used for lock-screen notifications (safe to share).
// The private half lives only in Vercel as VAPID_PRIVATE_KEY.
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BN5eV8IuqYllNlEnj-7w36M58NRzlk7Q3_apPVdHlAxg1Nr0k9Xa1SCvs0aihHTx4jlRB2l_NF5vE__CY7UA1yo';
