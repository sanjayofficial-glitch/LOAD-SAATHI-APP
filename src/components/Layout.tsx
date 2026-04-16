Replace the problematic navigation links with regular anchor tags to bypass the TypeScript type issue:

```tsx
<!-- Before (causing error) -->
<Link href="/about" className="hover:text-gray-600 transition-colors">
  About
</Link>
<Link href="/contact" className="hover:text-gray-600 transition-colors">
  Contact</Link>
<Link href="/privacy" className="hover:text-gray-600 transition-colors">
  Privacy
</Link>

<!-- After (fixed) -->
<a href="/about" className="hover:text-gray-600 transition-colors">
  About
</a>
<a href="/contact" className="hover:text-gray-600 transition-colors">
  Contact
</a>
<a href="/privacy" className="hover:text-gray-600 transition-colors">
  Privacy
</a>
```

This change removes the TypeScript error while maintaining the same functionality and styling.