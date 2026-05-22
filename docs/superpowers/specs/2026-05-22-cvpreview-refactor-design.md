# CVPreview Refactor & Codebase Cleanup

## Goal

Restructure the Skill-Stacker CV builder's preview system and routing to support all 7 templates (including two-column and photo), fix broken routing, retire the monolithic `CVBuilderApp.tsx`, set up full testing, and complete remaining Phase 6 + Phase 9 work.

## Architecture Changes

### New Template Component Directory

Each template gets its own component file that renders section content only (no page wrapper):

```
app/components/templates/
  ClassicPreview.tsx
  ExecutivePreview.tsx
  ModernPreview.tsx
  MinimalPreview.tsx
  CreativePreview.tsx
  TwoColumnPreview.tsx
  AcademicPreview.tsx
  index.ts
```

### TemplatePreviewProps

```typescript
interface TemplatePreviewProps {
  personal: PersonalInfo;
  profile?: string;
  competency: string[];
  experiences: Experience[];
  education: Education[];
  certificate: Certificate[];
  skill: string[];
  reference: Reference[];
  additionalInfo: string[];
  colors: { primary: string; secondary: string; accent: string; text: string; background: string };
  fontPair: { heading: string; body: string };
  photoUrl?: string;
}
```

### Template Component Contract

Each template component returns `TemplateSections`:

```typescript
interface TemplateSection {
  key: string;
  content: ReactNode;
  estimatedHeight: number;
  canBreak: boolean;
}
interface TemplateSectionsResult {
  sidebar?: TemplateSection[];    // used for two-column
  main: TemplateSection[];        // always rendered
}
```

Single-column templates return only `main`. Two-column templates return both `sidebar` and `main`.

### CVPreview Refactoring

`CVPreview.tsx` keeps:
- Pagination logic (`calculatePages`, measured heights, page nav)
- Debug overlays
- Page wrapper (A4 dimensions, padding)
- `<style>` injection from `getTemplateClasses()`

New responsibilities:
- Accept `templateId`, `themeId`, `fontPairId`, `photoUrl` props
- Resolve theme colors from `templateDefinitions`
- Call template factory to get sections
- For two-column: merge sidebar sections into sidebar column, main into main column, track heights separately

### Routing Fixes

1. `/cvs/new/page.tsx` — POST `/api/cv` with `template_settings` → redirect to `/cvs/[id]/edit`
2. `/cvs/[id]/edit/page.tsx` — pass `templateSettings` to CVPreviewWrapper
3. `CVPreviewWrapper.tsx` — forward template props to CVPreview
4. `/cvs/[id]/preview/page.tsx` — forward template props
5. Wire export buttons on edit page to `app/lib/export/exportDispatcher.ts`

### CVBuilderApp.tsx Retirement

Mark as deprecated. Verify no imports from page routes reference it (they don't). Leave file for reference during transition.

## Implementation Order

### Step 1: Create template component files
- 7 preview components + `index.ts` with factory
- Each extracts section rendering from current `CVPreview.tsx`

### Step 2: Update CVPreview
- Add template/theme/font/photo props
- Inject tailwind styles
- Use template factory
- Two-column page layout

### Step 3: Update CVPreviewWrapper
- Forward new props

### Step 4: Fix routing
- `/cvs/new` creates CV via API + redirects to `/cvs/[id]/edit`
- Edit page passes template settings through

### Step 5: Wire export buttons
- Replace stubs with real exports from `exportDispatcher.ts`

### Step 6: Photo support
- Ensure photo URL flows from API → edit page → preview
- TwoColumnPreview and AcademicPreview render photo

### Step 7: Phase 6 completion
- Verify all 7 templates match PDF export styles
- Test multi-page, two-column, photo, theme colors

### Step 8: Phase 9 cleanup
- Remove `app/api/chat/`, `completions/`, `embeddings/`, `models/`, `responses/`, `seed/` routes entirely
- Remove `app/components/ai-disabled/` folder
- Remove OpenAI dependency from `package.json`
- Remove LLM config from `app/lib/env.ts` and `app/lib/llm/`

### Step 9: Testing setup
- Install Vitest + Playwright
- Create `vitest.config.ts`
- Write unit tests for: `calculatePages`, template factory, `getTemplateClasses`, section height estimation
- Write Playwright e2e test for: create CV → select template → fill form → preview → page navigation

### Step 10: Lint & verify
- `npm run lint` — fix all Biome issues
- Full manual flow verification
