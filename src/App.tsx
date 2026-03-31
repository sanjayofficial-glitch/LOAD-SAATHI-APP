Replace the SignOutButton line to remove the `className` prop:

```tsx
<SignedIn>
  <div className="flex items-center gap-3">
    <UserButton />
    <SignOutButton />
  </div>
</SignedIn>