package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.ActivityEndpointMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityEndpointMapRepository extends JpaRepository<ActivityEndpointMap, Long> {
    List<ActivityEndpointMap> findByHttpMethodIgnoreCaseAndEnabledTrue(String httpMethod);

    @Query("select distinct a.activityName from ActivityEndpointMap a where a.enabled = true order by a.activityName asc")
    List<String> findDistinctEnabledActivityNames();
}
