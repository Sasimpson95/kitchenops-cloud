# KitchenOps v0.9.4 — Purchasing & Receiving

This release improves the purchasing workflow:

- New purchase orders start as Sent when completed.
- Drafts are only created when a started order is explicitly saved or kept when closing.
- Supplier products are filtered correctly.
- Suggested order quantities use current stock, reorder point, maximum stock and purchase-unit conversion.
- Standalone invoice receiving filters products by supplier.
- Receiving an order or invoice updates inventory and the product's latest purchase price.
- Purchase price history is recorded by product, supplier and source document.
- Purchasing dashboard shows live price-change count, recent standalone invoices and supplier spend.
- Generic purchase order numbering uses PO-000001 instead of a site-specific prefix.
- Orders, invoices and price history are separated by business workspace.
- Zero-site businesses receive a safe empty state.
