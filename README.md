# BCG ERP prototype (multi-page)

Open `index.html` in Chrome or Edge (double-click is enough, no install needed). It opens the **Sign in** page.
If your browser keeps data apart per file (Firefox does), serve the folder instead and open http://localhost:8765:

```bash
python -m http.server 8765 --directory prototypes/bcg-erp
```

Every screen is its own HTML page. All pages share the same CSS and JavaScript. **localStorage is the database**: users,
businesses, vouchers, employees and emails are all kept in the browser, so everything is still there after a reload.

## Sign in, businesses and users

```
 Create account ──► verify email ──► Sign in ──► Select Business ──┬─► open a business ──► the app
 (Alt+N)           (link in the       (Ctrl+A)    (Alt+B anytime)   ├─► accept an invitation
                    Mailbox)                                         └─► N  Business Registration ──► Business Setup
 Forgot password (Alt+F) ──► reset link in the Mailbox ──► new password (lifts a lock, signs out everywhere)
 Invitation email ──► Accept invitation: new person creates an account, existing person signs in ──► joins with the role given
```

**Mailbox (prototype only).** There is no real email. Every email the app sends (verify, reset password, invitations,
"you are now the Owner") lands on the **Mailbox** page, for every address. Enter opens an email, Enter again follows its link.
Open it with Alt+M on the sign-in pages, or from the menu (Prototype → Mailbox).

**Sample users.** All use the password `Sample@123`. On the Sign in page **Alt+U** signs in as any of them in one step.

| Email | Sample Traders Pvt. Ltd. | Himal Hardware Suppliers |
|---|---|---|
| sita@sample.test | **Owner** | Accountant |
| hari@sample.test | Accountant | **Owner** |
| gita@sample.test | Manager | |
| ramesh@sample.test | Sales/Cashier, linked to employee Ramesh Karki | |
| sunita@sample.test | Employee (HRM only), linked to Sunita Thapa | |
| mohan@sample.test | Viewer | |
| kiran@sample.test | Deactivated | |
| anita@sample.test (no account yet) | invitation waiting in the Mailbox (Accountant) | |
| bikash@sample.test (no account yet) | invitation expired (R on User Management sends it again) | |

Sample Traders has the sample ledgers, vouchers and employees; Himal Hardware and every newly registered business start
with only the default ledgers (Cash, Profit & Loss, VAT, TDS Payable, Sales, Purchase), no vouchers and no employees.

| Screen | What it does |
|---|---|
| **Sign in** | 5 wrong passwords lock the account for 15 minutes. An unverified email cannot sign in (it offers to resend the link). |
| **Create account** | name, email, mobile (optional), password twice. Password rules: 8+ characters, not only digits, not a common password, not like your name or email. Open self sign-up (B1 is still open). |
| **Select Business** | your businesses and role in each, invitations waiting for your email (Enter accepts), businesses you deleted (Enter restores, 30 days). N registers a new business. |
| **Business Registration** | required: name, address, phone, books-beginning date (BS). Optional: type, email, PAN (9 digits), VAT registered (needs PAN). A PAN already used by one of your businesses asks first. You become the Owner. |
| **Business Setup** | Business (name, type, address, phone, email) · Branding (logo: Space picks a picture, Delete removes; logo on prints Y/N; two brand colours) · Tax (PAN, VAT, VAT rate) · Books (FY, books beginning, **lock books up to**: Owner only) · Voucher numbering (prefix per type; a saved voucher keeps its prefix). Shows "% complete" of the optional items. Admin edits, Accountant / Manager / Viewer see it read-only. **Alt+D** deletes the business (Owner; restorable 30 days). |
| **User Management** | N invite (email, name, role, linked employee; valid 7 days) · Enter change role / employee link · D deactivate (or cancel an invitation) · R reactivate (or send an invitation again) · **Alt+O** make another Admin the Owner (Owner only). You cannot change or deactivate yourself or the Owner. |
| **My Account** | name, mobile, **show dates in BS or AD** (for you only) · Alt+W change password (signs out your other devices) · Alt+O log out on all devices · your last sign-ins. |

What the business settings change elsewhere: the business name, address, PAN, phone and logo head every print; the lock
date and books-beginning date block voucher dates; prefixes number new vouchers; the logo shows in the top bar;
Business Tools shows what Business Information is missing. Setup, user and lock changes go into the Audit log.

## Dashboard and Groups

**Dashboard** is the first screen of Account (the menu has the focus; → or Esc steps into the dashboard). Figures follow
mvp-plan §2.0, for the period shown in the title bar: the running BS month by default, ← → another month, F2 a month or the
whole year to date.

```
 To receive · To give · Cash & Bank          (balances as at the period end, or today)
 Sales · Purchase · Expenses                 (movement in the period; hidden for Sales/Cashier: no profit figures)
 Money in and out of Cash & Bank             (columns per day, or per month for the year; Contra transfers left out; hover for figures)
 Cash & Bank ledgers  |  Recent vouchers     (Sales/Cashier: own vouchers only) · All vouchers → Day Book
 Reports: Trial Balance, Profit & Loss, Balance Sheet, Ledger Report · "Business Setup is missing …" (Admin only, when something is)
```

↑ ↓ visits everything that opens something, Enter opens it (a tile opens its report, a ledger its Ledger Report, a voucher its
alteration or print preview); Esc in the report comes back to the dashboard. Not there yet: Upcoming Reminders (the Reminders
screen comes later). Quick POS, Add Sales and Add Purchase stay hidden; F4 to F7 add vouchers.

**Groups** (open questions R1 to R4, built on the proposed answers in `docs/proposed-answers.md`):

| | |
|---|---|
| **List of Groups** | the proposed predefined tree (R1, needs accountant review) with Nature, Cash flow class (R3) and ledger count; custom groups are indented under their parent and tagged *Custom*; a renamed group shows its original name in brackets. Enter alters, N creates, Del deletes. |
| **Group Creation / Alteration** | Name and Under; Nature and Cash flow come from the parent group. A custom group can go under any group (also under another custom group) and can be moved later. A predefined group can only be renamed (R2; switch it off on the Options page), never moved or deleted. |
| Deleting | only a custom group with no ledgers and no sub-groups (R4). |

A custom group behaves like its parent everywhere: a group under Sundry Debtors makes bill-wise customer ledgers, its
ledgers roll up into the parent in the Trial Balance, Balance Sheet and Profit & Loss, Group Summary drills into it, and
Cash Flow classifies it like the parent. Groups belong to the business (`S.groups` custom groups, `S.gren` renames).
Admin and Accountant change groups; Manager and Viewer see the list (Enter shows the group's figures); Sales/Cashier has no Groups.

## Roles

Default matrix from `docs/proposed-answers.md` (S5). The HRM rows and the Employee role are prototype defaults, not decided yet.
Change them in `assets/js/core/roles.js` (`PERM`).

| | Admin (Owner) | Accountant | Manager | Sales/Cashier | Viewer | Employee |
|---|---|---|---|---|---|---|
| Groups | change | change | view | | view | |
| Ledger create | ✓ | ✓ | ✓ | | | |
| Ledger list | ✓ (delete) | ✓ (delete) | ✓ | ✓ | ✓ | |
| Contra / Payment / Receipt | ✓ | ✓ | ✓ | ✓ | | |
| Journal | ✓ | ✓ | ✓ | | | |
| Alter / cancel vouchers | both | both | alter | | | |
| Reports (TB, BS, P&L, Cash Flow) | ✓ | ✓ | ✓ | | ✓ | |
| Ledger Report, Day Book | ✓ | ✓ | ✓ | own vouchers only | ✓ | |
| Audit log | ✓ | | | | | |
| HRM admin screens | ✓ | | ✓ | | | |
| Business Tools | ✓ | | ✓ | ✓ | | |
| Business Setup | edit | view | view | | view | |
| User Management | ✓ | | | | | |

Anyone linked to an employee record also gets the HRM **Me** screens (Attendance, Leave, Salary).
Only the Owner locks books, deletes the business or hands ownership on. Someone who may not alter vouchers sees a print
preview when they open one from the Day Book or a report. A screen you may not open sends you to your first screen;
the menu, Go To and the F-keys only offer what your role allows.

## Folder map

```
bcg-erp/
  index.html                 opens pages/login.html
  pages/                     one small HTML file per screen (no logic inside)
    login / signup / verify-email / forgot-password / reset-password / accept-invite .html
    select-business.html  business-register.html  mailbox.html            (no menu: the panel in the middle)
    business-setup.html  users.html  my-account.html                       (Company, inside the app)
    home.html                Dashboard (the Account gateway)
    group-list.html  group-form.html               groups (address ?g=<group> alters one)
    contra / payment / receipt / journal .html     vouchers (F4 to F7)
    ledger-create.html  ledger-list.html           ledgers
    day-book.html  audit-log.html
    trial-balance / balance-sheet / profit-loss / cash-flow .html
    group-summary.html       drill-down, address ?g=<group>
    ledger-report.html       address ?l=<ledger id>&b=1 (b=1 shows pending bills)
    hr-*.html  bt-home.html  HRM and Business Tools
    options.html             the open questions as switches, Alt+R resets the whole prototype
  assets/
    css/   base, shell, panel, reports, fields, voucher, lists, popups, responsive, print, hrm, auth, dash
    js/
      core/    no screen code: util, calendar, money, db (the database), roles, data, store, accounts, balances, hrm
      ui/      shared screen machinery: dom, messages, fields, picker, popups, form, print, nav, shell
      pages/   one script per screen: auth/ (sign-in pages), company/ (setup, users, my account), hrm/, reports/
```

## Three parts: Account, HRM, Business Tools

The top bar switches between the parts you may open (click, or Alt+1 / Alt+2 / Alt+3). The left menu shows the part you are in,
then the Company screens (Business Setup, User Management, My Account). Alt+G (Go To) finds a screen in any part.
The business name in the top bar (or Alt+B) changes business; your name opens My Account; Alt+Q logs out.

```
Account         Dashboard, Groups, Ledger, vouchers, reports
HRM             kept small: Admin has 4 screens (plus a leave detail page), "Me" has 3 screens
Business Tools  one screen for now, the list of tools is decided later
```

| Who | HRM screens |
|---|---|
| Admin, Manager | **Create Employee** (name, designation, joining date, phone, monthly salary, and optionally a login email that sends an Employee invitation) · **Employee List** (Enter alters, N creates; the Login column shows who can sign in) · **Approve Leave** (Enter opens the request; A approve or R reject with a remark) · **Salary Spends** (month by month; Y pays the month; Enter opens one employee's salary detail) |
| Linked to an employee | **Attendance** (I punch in, O punch out) · **Leave** (N apply, list with status) · **Salary** (one row per paid month, Enter for the detail) |

Sample rules (change them in `core/hrm.js`): Saturday is the weekly off; a past working day with no punch counts as absent; absent and unpaid-leave days are deducted at salary / days in the month; leave per year is Annual 18, Sick 12, Casual 6, plus Unpaid. Paying a month saves the figures and (switch **H1** on the Options page) posts one Payment voucher in Account: Dr Salary / Cr NIC Asia bank.

## How a page works

A page file lists the shared scripts, then one page script. The page script ends with `start({...})`, handing the shell
an object that says what the screen is:

| Member | Meaning |
|---|---|
| `id`, `title` | screen id (same as in `ROUTES`) and the title used in print headings |
| `view()` | returns the HTML of the screen |
| `focus()` | selector of the first field to put the cursor in |
| `keys()` | entries of the key rail on the right (Esc is added with `escKey()`) |
| `key(e)` | screen keys, such as arrows in a list; return `true` when handled |
| `back()` | what Esc does (default: move to the left menu) |
| `init()`, `ready()` | before / after the first draw (`init()` returning `false` stops: it moved to another page) |
| `state`, `activate()` | list state for mouse clicks on rows |
| `bare` | sign-in style page: no menu, the panel in the middle |
| `access` | `'public'` (no sign-in), `'guest'` (public; a signed-in user is sent on), `'user'` (signed in, no business needed). Default: signed in, a business open, and the role may see the screen (`SCREEN` in `ui/nav.js`) |

Screens register what they own instead of the shell knowing about every screen:

- `FIELD[data-f]` in `ui/fields.js`: key, Enter, input, amount and date handling of a field
- `PICK[data-f]` in `ui/picker.js`: the type-to-search lists
- `PANELS[kind]` in `ui/popups.js`: detail popups (bill details, cheque details, new ledger, change period, Go To, invite user, change password, an email)
- `form({...})` in `ui/form.js`: a whole Tally-style form from a list of fields (text, password, pick list, Y/N, colour, picture, read-only); the sign-in, business and user screens use it

Page scripts must not read `CUR.biz` or `CUR.user` at load time (do it in `init()`): the shell decides only in `start()`
whether the page may open at all.

## Adding a page

1. Add the screen id and file name to `ROUTES`, to `MENU` / `TAIL` if it should be in the menu, and to `SCREEN` if a role is needed (`ui/nav.js`).
2. Copy any page from `pages/`, change `<title>`, `data-page` and the last `<script>` line (add `class="bare"` to `<body>` for a sign-in style page).
3. Write `assets/js/pages/<name>.js`: your `view()` and handlers, then `start({...})`.

## Saved data (localStorage)

| Key | What |
|---|---|
| `bcg.db` | the platform tables (`core/db.js`): users, businesses, members (role, Owner flag, employee link, status), invites, one-time links, emails, sessions, sign-in log |
| `bcg.session` | the sign-in on this browser (ends after 7 days unused, on log out, or on "log out all devices") |
| `bcg.biz.<business>` | one business's data, shared by its users: custom groups and renames, ledgers, vouchers, audit log, options, employees, attendance, leave, salary |
| `bcg.ui.<business>.<user>` | where one user left the screens in that business: drafts, Day Book position, dashboard period, menu part |
| `bcg.flash` | a message for the next page (for example "Email verified") |

Businesses never see each other's data. Data saved by the earlier one-business prototype (`bcg-erp-prototype-v1`) becomes
Sample Traders' data the first time. Passwords are hashed, but nothing here is secure: it is a prototype in the browser.
**Alt+R on the Options page** resets the whole prototype to the sample data and signs you out.

## Keyboard

The same rules as before: Enter next field, Backspace previous field, Esc back (and then the menu), Ctrl+A accept,
Alt+G Go To, Alt+B change business, Alt+Q log out, F4 to F7 vouchers, F2 date or period, Ctrl+E example voucher,
Ctrl+H Account layout. In forms, Y / N (or Space) answer Yes/No fields and a picture field opens the file chooser with Space.
Browser shortcuts are blocked. Warnings and questions are popups, successes are a toast at the top right, hints stay in the bar at the bottom.

## Old single-file version

`../voucher-ledger-prototype.html` is the previous one-file prototype, left untouched for comparison. Nothing here depends on it.
