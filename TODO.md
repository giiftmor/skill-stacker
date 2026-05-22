# Skill-Stacker Improvement Tasks

## Phase 0: Disable AI Code ✅
- [x] Comment out `/api/chat/route.ts` → return 501
- [x] Comment out `/api/models/route.ts`
- [x] Comment out `/api/completions/route.ts`
- [x] Comment out `/api/embeddings/route.ts`
- [x] Comment out `/api/responses/route.ts`
- [x] Comment out `/api/seed/route.ts`
- [x] Hide `/components/ai/` folder (renamed to ai-disabled)
- [x] Remove `testAi` state from `CVBuilderApp.tsx`
- [x] Remove AI nav button from `CVBuilderApp.tsx`
- [x] Remove AI references from `app/page.tsx` (removed components/page.tsx)

## Phase 1: Database Migrations ✅
- [x] Add `cv_photos` table to PostgreSQL
- [x] Add `template_settings` column to `cvs` table (JSONB)
- [x] Add `cv_versions` table
- [x] Added types/interfaces in db.ts

## Phase 2: File Storage Module ✅
- [x] Create `app/lib/storage.ts` — upload, serve, delete helpers
- [x] Create `app/api/upload/route.ts`
- [x] Create `app/api/photo/[cvId]/route.ts`
- [x] Create `app/components/ui/UploadPhoto.tsx`
- [x] Handle cleanup on CV delete (in storage.ts)

## Phase 3: Template System Architecture ✅
- [x] Create `app/lib/templates/templateDefinitions.ts` — 7 templates
- [x] Create `app/lib/templates/pdfStyles.ts` — per-template PDF StyleSheet
- [x] Create `app/lib/templates/docxStyles.ts` — per-template docx builders
- [x] Create `app/lib/templates/tailwindStyles.ts` — per-template preview classes
- [x] Define theme structure (MS Word-style colour schemes)

## Phase 4: Navigation & Routing ✅
- [x] Create `app/cvs/page.tsx` — CV list
- [x] Create `app/cvs/new/page.tsx` — New CV with template selector
- [x] Create `app/cvs/[id]/edit/page.tsx` — Edit CV
- [x] Create `app/cvs/[id]/preview/page.tsx` — Full-screen preview
- [x] Create `app/components/ui/Sidebar.tsx` — Sidebar navigation
- [x] Create `app/components/ui/Breadcrumb.tsx`
- [x] Create `app/components/ui/ProgressBar.tsx`
- [x] Create `app/components/ui/SaveIndicator.tsx`
- [x] Create `app/components/ui/Header.tsx`
- [x] Refactor `CVBuilderApp.tsx` into page-level components (via /cvs routes)
- [x] Update `app/page.tsx` to landing page

## Phase 5: Template Selector UI ✅
- [x] Create `app/components/ui/TemplateSelector.tsx` — 7-card grid
- [x] Add theme picker per template
- [x] Add font pair selector
- [x] Add colour scheme selector (MS Word-style)
- [ ] Live preview refresh on change

## Phase 6: CVPreview Refactor
- [ ] Accept `template` + `theme` props in CVPreview
- [ ] Two-column layout support (sidebar)
- [ ] Photo rendering for Academic template
- [ ] Section-aware multi-page rendering
- [ ] Match PDF export exactly

## Phase 7: Export Refactor ✅
- [x] Create `app/lib/export/pdfExport.ts` — multi-page, template-aware
- [x] Create `app/lib/export/docxExport.ts` — template-aware, two-column, photo
- [x] Create `app/lib/export/exportDispatcher.ts`
- [x] Create `app/components/ui/ExportModal.tsx` — with PDFViewer preview
- [x] Fix `borderBottom: "2 solid #333"` → `borderBottom: "2px solid #333"`
- [x] Restore certificates section in docx export
- [x] Apply theme colours throughout

## Phase 8: Auto-Save & Version History ✅
- [x] Create `app/hooks/useAutoSave.ts` — debounced 30s save
- [x] Integrate SaveIndicator component
- [x] Create `app/lib/versions.ts` — save/restore/list versions
- [x] Create `app/components/ui/VersionHistory.tsx` — sidebar panel
- [x] Version restore creates new save point
- [x] Max 20 versions per CV (auto-prune)

## Phase 9: Polish & Testing
- [ ] Remove all AI dead code
- [ ] Lint pass
- [ ] Full flow test: create → select template → fill → preview → export
- [ ] Verify multi-page PDF, two-column, photo, theme colours
- [ ] Test auto-save indicator
- [ ] Test version history and restore
- [ ] Test photo upload and display

---

## Template Definitions (7)

### 1. Classic
- Default template, clean traditional layout
- Color scheme: Charcoal (#333) / Gray (#555)
- No photo, single column

### 2. Executive
- Dark header bar, premium formal
- Color scheme: Navy (#1a1a2e) + Gold (#c9a227)
- No photo, single column

### 3. Modern
- Bold left sidebar, teal accent
- Color scheme: Teal (#0f766e)
- No photo, single column

### 4. Minimal
- Ultra-clean whitespace-heavy
- Color scheme: Black (#000) / Gray (#888)
- No photo, single column

### 5. Creative
- Color-blocked sections, bold headers
- Color scheme: Purple (#7c3aed) + Orange (#f97316)
- No photo, single column

### 6. Two-Column
- Left sidebar for skills/competencies/photo
- Color scheme: Blue (#1e3a5f)
- Photo supported, two columns

### 7. Academic
- Structured, citation-style
- Color scheme: Blue-gray (#1e40af)
- Photo supported (required placeholder), single column

---

## File Inventory

### NEW files to create (~25)
- `app/lib/storage.ts`
- `app/lib/versions.ts`
- `app/lib/templates/templateDefinitions.ts`
- `app/lib/templates/pdfStyles.ts`
- `app/lib/templates/docxStyles.ts`
- `app/lib/templates/tailwindStyles.ts`
- `app/lib/export/pdfExport.ts`
- `app/lib/export/docxExport.ts`
- `app/lib/export/exportDispatcher.ts`
- `app/hooks/useAutoSave.ts`
- `app/api/upload/route.ts`
- `app/api/photo/[cvId]/route.ts`
- `app/cvs/page.tsx`
- `app/cvs/new/page.tsx`
- `app/cvs/[id]/edit/page.tsx`
- `app/cvs/[id]/preview/page.tsx`
- `app/components/ui/Sidebar.tsx`
- `app/components/ui/Breadcrumb.tsx`
- `app/components/ui/ProgressBar.tsx`
- `app/components/ui/SaveIndicator.tsx`
- `app/components/ui/Header.tsx`
- `app/components/ui/TemplateSelector.tsx`
- `app/components/ui/UploadPhoto.tsx`
- `app/components/ui/ExportModal.tsx`
- `app/components/ui/VersionHistory.tsx`

### FILES to modify (~15)
- `app/page.tsx`
- `app/components/ui/CVBuilderApp.tsx`
- `app/components/ui/CVPreview.tsx`
- `app/components/ui/CVPreviewWrapper.tsx`
- `app/components/modules/exportModule.tsx`
- `app/components/modules/CVBuilderForm.tsx`
- `app/components/Forms/*.tsx` (all form components)
- `app/lib/db.ts`
- `app/lib/types.ts`
- `app/schemas.ts`
- `app/lib/db.ts.env`
- `globals.css`
- `app/lib/dummyData.ts`
- `docker-compose.yml` (add volume for uploads)
- `.env` (add UPLOAD_DIR)