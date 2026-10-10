<!-- EMBER:BEGIN -->
> [!IMPORTANT]
> EMBER QR Kitchen - Restaurant Management System
> This project manages restaurant orders, kitchen operations, and staff workflows.
> Keep the main branch stable as it may be deployed to production.
<!-- EMBER:END -->

- Order totals are computed by a database trigger from menu prices; never trust client totals (prevents price tampering).
- Staff permissions come from the user_roles table via has_role(); the first account to sign up gets the staff role automatically.
