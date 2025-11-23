package com.autandojam.repository;

import com.autandojam.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Integer> {
    Page<ActivityLog> findByUserUserId(Integer userId, Pageable pageable); // fixed nested property
    Page<ActivityLog> findByAction(String action, Pageable pageable);
}
