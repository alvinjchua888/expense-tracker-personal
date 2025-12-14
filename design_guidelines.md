# Daily Expense Tracking App - Design Guidelines

## Design Approach

**Selected Framework:** Material Design System
**Justification:** This finance/productivity application requires clear data hierarchy, efficient information density, and robust component patterns. Material Design excels at data-heavy interfaces with strong visual feedback and interaction patterns.

**Core Principles:**
- Clarity over decoration: Information takes precedence
- Purposeful density: Maximize data visibility without overwhelming
- Consistent patterns: Familiar interactions reduce cognitive load
- Visual hierarchy: Guide users through complex financial data

---

## Typography

**Font Family:** Inter (via Google Fonts CDN)
- Primary: Inter for all UI elements
- Fallback: system-ui, sans-serif

**Type Scale:**
- Page Titles: text-3xl font-bold (30px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-semibold (18px)
- Body Text: text-base font-normal (16px)
- Labels/Captions: text-sm font-medium (14px)
- Metadata/Helper: text-xs font-normal (12px)

**Number Display (Financial Data):**
- Large amounts: text-2xl font-bold tabular-nums
- Table amounts: text-base font-semibold tabular-nums
- Small amounts: text-sm font-medium tabular-nums

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Tight spacing: p-2, gap-2 (form fields, compact lists)
- Standard spacing: p-4, gap-4 (cards, general padding)
- Section spacing: p-6, gap-6 (dashboard sections)
- Major spacing: p-8, gap-8 (page-level separation)
- Extra spacing: p-12, p-16 (hero areas, major divisions)

**Grid System:**
- Dashboard: 12-column grid (grid-cols-12)
- Analytics: 2-3 column layouts (lg:grid-cols-3 md:grid-cols-2)
- Forms: Single column with max-w-2xl
- Tables: Full-width with horizontal scroll on mobile

**Container Widths:**
- Main content: max-w-7xl mx-auto
- Forms: max-w-2xl
- Modals: max-w-lg to max-w-3xl depending on content

---

## Component Library

### Navigation
**Top Bar:** Fixed header with app logo/name, main navigation links (Dashboard, Expenses, Analytics, Categories), user profile dropdown
- Height: h-16
- Structure: Horizontal flex with space-between
- Shadow: shadow-sm with subtle border-b

### Dashboard Layout
**Three-Column Summary Cards:** Quick stats (Total Expenses, This Month, This Week)
- Grid: grid-cols-1 md:grid-cols-3 gap-4
- Card structure: Rounded corners (rounded-lg), shadow-sm, p-6
- Content: Large number display + label + trend indicator (up/down arrow with percentage)

**Recent Expenses List:** Card-based layout showing last 10 transactions
- Structure: Vertical list with dividers
- Each item: Flex layout with merchant/category on left, amount on right, date below
- Hover state: subtle background change

### Expense Entry Form
**Modal/Slide-over:** Opens from button or floating action button
- Fields: Amount (number input), Date (date picker), Category (dropdown/select), Merchant (text), Description (textarea), Receipt Upload (file input with preview)
- Layout: Stacked fields with consistent spacing (gap-4)
- Buttons: Primary "Save Expense" + Secondary "Cancel"

**Receipt Scanner Interface:**
- Drag-and-drop zone with upload button
- Image preview with loading state during OCR processing
- Auto-populated fields with editable values
- Visual indicator showing extracted vs. manual data

### Analytics Dashboard
**Multi-Chart Layout:**
- Top section: Date range selector (preset buttons: Week/Month/Year + custom range picker)
- Chart grid: grid-cols-1 lg:grid-cols-2 gap-6
- Chart types: 
  - Spending by Category (Donut/Pie chart)
  - Trend Over Time (Line/Area chart)
  - Category Comparison (Horizontal bar chart)
  - Monthly Breakdown (Stacked bar chart)

**Data Tables:**
- Header: Sticky with sorting indicators
- Rows: Zebra striping (alternate row backgrounds)
- Columns: Merchant, Category, Amount, Date, Actions
- Mobile: Stack columns or horizontal scroll

### Category Management
**Category List:** Grid of category cards with icon, name, total spent, edit/delete actions
- Grid: grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4
- Card: Compact with icon at top, name centered, amount below
- Add Category: Prominent card with "+" icon

### Buttons & Actions
**Primary Actions:** Solid buttons with rounded-md, px-4 py-2
**Secondary Actions:** Outlined buttons with border
**Icon Buttons:** Square (w-10 h-10) with centered icon
**Floating Action Button (FAB):** Fixed bottom-right for quick expense entry (rounded-full, w-14 h-14, shadow-lg)

### Forms & Inputs
**Text Inputs:** border rounded-md px-3 py-2, focus ring
**Select Dropdowns:** Match text input styling with chevron icon
**Date Picker:** Calendar popup with month/year navigation
**File Upload:** Dashed border box with icon and text, shows preview on selection
**Labels:** Above inputs, text-sm font-medium, mb-1

### Cards & Containers
**Standard Card:** rounded-lg shadow-sm p-6 with optional header section
**Stat Cards:** Larger padding (p-8) with prominent number display
**Chart Containers:** White background, rounded-lg, p-6, shadow-sm

### Icons
**Icon Library:** Heroicons (via CDN)
- Navigation: outline style at 24px
- Buttons/Actions: outline style at 20px
- Indicators: solid style at 16px
- Categories: Choose from dollar-sign, shopping-cart, utensils, car, home, etc.

---

## Interactions & States

**Animations:** Minimal and purposeful only
- Button hover: subtle scale (hover:scale-105) on FAB only
- Chart transitions: smooth data updates (300ms ease)
- Modal entry: slide-in from right (receipt scanner) or fade-in (forms)
- Loading states: Spinner for async operations (OCR processing, data fetching)

**No animations for:**
- Standard buttons
- Navigation clicks
- List items
- Table sorting

---

## Responsive Behavior

**Mobile (< 768px):**
- Single column layouts
- Stacked navigation (hamburger menu)
- Full-width forms and cards
- Simplified charts (fewer data points)
- FAB for primary actions

**Tablet (768px - 1024px):**
- 2-column grids where applicable
- Condensed navigation
- Side-by-side form layouts

**Desktop (> 1024px):**
- Full multi-column layouts
- Persistent navigation
- Side-by-side dashboards and analytics

---

## Images

No hero images required for this utility application. Focus on:
- Receipt image previews (thumbnails in expense list, full size in detail view)
- Empty states: Simple illustrations for "no expenses yet" (use placeholder comments for custom SVG)
- Category icons: Use icon library, not images