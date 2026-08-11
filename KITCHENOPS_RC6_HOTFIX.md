# KitchenOps 1.0.0 RC6 Hotfix

RC6 fixes KOPS-RC-023.

- Chef clients mirror server permissions before queueing operational changes.
- Chef automatic Prep/Handover rollover cannot manufacture forbidden cloud deletes.
- HTTP 403 operational sync rejections are treated as permanent, removed from the retry queue, and followed by a cloud refresh.
- Manager/Operations behaviour and RC5 Prep concurrency remain unchanged.

No Supabase migration is required.
