# KitchenOps 1.0.0 RC9 — Multi-unit Stocktake Prototype

- Stocktake count screen can accept both purchase/count units and base inventory units.
- Example: 1 Case + 24 Each; 1.5 Bottles + 0 Litres.
- Count-unit arrow controls step by one while typed decimals remain accepted.
- Inventory-unit `Each` requires whole numbers.
- Existing stocktake storage and inventory maths are unchanged; entered units are aggregated back to the inventory unit.

This prototype uses the two unit levels already present in KitchenOps product data: inventory unit + purchase/count unit. A third case/outer unit requires an additional product setup field and is intentionally not invented in this hotfix.
