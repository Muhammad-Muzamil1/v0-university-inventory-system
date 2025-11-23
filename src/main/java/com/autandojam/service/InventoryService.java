package com.autandojam.service;

import com.autandojam.dto.ItemDTO;
import com.autandojam.entity.*;
import com.autandojam.repository.InventoryItemRepository;
import com.autandojam.repository.StockTransactionRepository;
import com.autandojam.repository.ActivityLogRepository;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    @Autowired
    private InventoryItemRepository itemRepository;

    @Autowired
    private StockTransactionRepository transactionRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;


    // --------------------- FETCHING -------------------------

    public Page<ItemDTO> getAllItems(Pageable pageable) {
        return itemRepository.findAll(pageable).map(this::convertToDTO);
    }

    public Page<ItemDTO> searchItems(String query, Pageable pageable) {
        return itemRepository.searchByName(query, pageable).map(this::convertToDTO);
    }

    public Page<ItemDTO> getItemsByCategory(Integer categoryId, Pageable pageable) {
        return itemRepository.findByCategory_CategoryId(categoryId, pageable).map(this::convertToDTO);
    }

    public ItemDTO getItemById(Integer itemId) {
        return itemRepository.findById(itemId)
                .map(this::convertToDTO)
                .orElse(null);
    }


    // --------------------- CREATE -------------------------

    @Transactional
    public ItemDTO createItem(InventoryItem item, User user) {
        item.setAddedBy(user);
        item.calculateTotalValue();

        InventoryItem saved = itemRepository.save(item);
        logActivity(user, "ITEM_CREATED", "InventoryItem", saved.getItemId(),
                "Created item: " + saved.getItemName());

        return convertToDTO(saved);
    }


    // --------------------- UPDATE -------------------------

    @Transactional
    public ItemDTO updateItem(Integer itemId, InventoryItem updatedItem, User user) {
        return itemRepository.findById(itemId).map(item -> {

            item.setItemName(updatedItem.getItemName());
            item.setCategory(updatedItem.getCategory());
            item.setDescription(updatedItem.getDescription());
            item.setLocation(updatedItem.getLocation());
            item.setSku(updatedItem.getSku());
            item.setUnitPrice(updatedItem.getUnitPrice());
            item.setReorderLevel(updatedItem.getReorderLevel());

            item.calculateTotalValue();

            InventoryItem saved = itemRepository.save(item);

            logActivity(user, "ITEM_UPDATED", "InventoryItem", itemId,
                    "Updated item: " + saved.getItemName());

            return convertToDTO(saved);

        }).orElse(null);
    }


    // --------------------- DELETE -------------------------

    @Transactional
    public boolean deleteItem(Integer itemId, User user) {
        if (!itemRepository.existsById(itemId)) return false;

        itemRepository.deleteById(itemId);
        logActivity(user, "ITEM_DELETED", "InventoryItem", itemId, "Deleted item");

        return true;
    }


    // --------------------- STOCK OPERATIONS -------------------------

    @Transactional
    public void addStock(Integer itemId, Integer quantity, String reference, User user) {
        itemRepository.findById(itemId).ifPresent(item -> {

            item.setQuantity(item.getQuantity() + quantity);
            item.calculateTotalValue();
            itemRepository.save(item);

            StockTransaction transaction = StockTransaction.builder()
                    .item(item)
                    .transactionType(TransactionType.IN)
                    .quantityChange(quantity)
                    .referenceNumber(reference)
                    .performedBy(user)
                    .build();

            transactionRepository.save(transaction);
            logActivity(user, "STOCK_ADDED", "InventoryItem", itemId,
                    "Added " + quantity + " units");
        });
    }


    @Transactional
    public void reduceStock(Integer itemId, Integer quantity, String reference, User user) {
        itemRepository.findById(itemId).ifPresent(item -> {

            if (item.getQuantity() < quantity) return; // safe guard

            item.setQuantity(item.getQuantity() - quantity);
            item.calculateTotalValue();
            itemRepository.save(item);

            StockTransaction transaction = StockTransaction.builder()
                    .item(item)
                    .transactionType(TransactionType.OUT)
                    .quantityChange(quantity)
                    .referenceNumber(reference)
                    .performedBy(user)
                    .build();

            transactionRepository.save(transaction);
            logActivity(user, "STOCK_REDUCED", "InventoryItem", itemId,
                    "Reduced " + quantity + " units");
        });
    }


    // --------------------- LOW STOCK -------------------------

    public List<ItemDTO> getLowStockItems() {
        return itemRepository.findLowStockItems()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }


    // --------------------- DTO MAPPER -------------------------

    private ItemDTO convertToDTO(InventoryItem item) {
        return ItemDTO.builder()
                .itemId(item.getItemId())
                .itemName(item.getItemName())
                .categoryId(item.getCategory().getCategoryId())
                .categoryName(item.getCategory().getCategoryName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalValue(item.getTotalValue())
                .description(item.getDescription())
                .location(item.getLocation())
                .sku(item.getSku())
                .reorderLevel(item.getReorderLevel())
                .addedBy(item.getAddedBy().getFullName())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }


    // --------------------- LOGGING -------------------------

    private void logActivity(User user, String action, String entityType, Integer entityId, String description) {
        ActivityLog log = ActivityLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .description(description)
                .build();

        activityLogRepository.save(log);
    }
}
