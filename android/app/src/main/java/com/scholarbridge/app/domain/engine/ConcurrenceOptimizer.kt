package com.scholarbridge.app.domain.engine

enum class SchemeFundingClassification {
    CENTRAL_MERIT,
    CENTRAL_WELFARE,
    STATE_POST_MATRIC,
    PHILANTHROPIC_STACKABLE
}

enum class ConcurrenceRelationship {
    MUTUALLY_EXCLUSIVE,
    DUAL_APPLY_SINGLE_DISBURSE,
    STACKABLE_GAP_FUNDING,
    INDEPENDENT_CATEGORY
}

data class OptimizationCandidate(
    val code: String,
    val slug: String,
    val name: String,
    val annualBenefitInr: Long,
    val classification: SchemeFundingClassification,
    val competitivenessWeight: Double // 0.0 to 1.0
)

data class ConcurrenceConflictPair(
    val scholarshipCodeA: String,
    val scholarshipCodeB: String,
    val relationship: ConcurrenceRelationship,
    val warningMessage: String
)

data class OptimizationResult(
    val target: String,
    val recommendedApplicationBundle: List<OptimizationCandidate>,
    val totalExpectedYieldInr: Long,
    val maxRealizableDisbursementInr: Long,
    val conflictsDetected: List<ConcurrenceConflictPair>,
    val dualApplicationGuidance: List<String>,
    val isFullyStackable: Boolean,
    val legalDisclaimer: String
)

/**
 * Deterministic Combinatorial Concurrence & Grant Optimization Engine.
 * Formulates and solves a 0/1 Knapsack problem with mutual exclusion constraints.
 * Operates offline in < 5ms with zero network I/O.
 */
object ConcurrenceOptimizer {

    fun solve(
        candidates: List<OptimizationCandidate>,
        annualCollegeFeesInr: Long? = null,
        target: String = "MAX_REALIZABLE_VALUE"
    ): OptimizationResult {
        if (candidates.isEmpty()) {
            return OptimizationResult(
                target = target,
                recommendedApplicationBundle = emptyList(),
                totalExpectedYieldInr = 0,
                maxRealizableDisbursementInr = 0,
                conflictsDetected = emptyList(),
                dualApplicationGuidance = emptyList(),
                isFullyStackable = true,
                legalDisclaimer = getLegalDisclaimer()
            )
        }

        // 1. Detect all pairwise conflicts
        val conflicts = detectConflicts(candidates)

        // 2. Generate NSP AY 2026-27 dual application guidance
        val guidance = generateDualApplicationGuidance(candidates)

        // 3. Find optimal non-conflicting subset
        val optimalBundle = findOptimalBundle(candidates, conflicts, target)

        val rawTotalBenefit = optimalBundle.sumOf { it.annualBenefitInr }
        val maxRealizable = if (annualCollegeFeesInr != null) {
            minOf(rawTotalBenefit, annualCollegeFeesInr)
        } else {
            rawTotalBenefit
        }

        val totalExpectedYield = optimalBundle.sumOf { (it.annualBenefitInr * it.competitivenessWeight).toLong() }

        val isFullyStackable = optimalBundle.size <= 1 || optimalBundle.all {
            it.classification == SchemeFundingClassification.PHILANTHROPIC_STACKABLE ||
                    optimalBundle.count { o ->
                        o.classification == SchemeFundingClassification.CENTRAL_MERIT ||
                                o.classification == SchemeFundingClassification.CENTRAL_WELFARE
                    } <= 1
        }

        return OptimizationResult(
            target = target,
            recommendedApplicationBundle = optimalBundle,
            totalExpectedYieldInr = totalExpectedYield,
            maxRealizableDisbursementInr = maxRealizable,
            conflictsDetected = conflicts,
            dualApplicationGuidance = guidance,
            isFullyStackable = isFullyStackable,
            legalDisclaimer = getLegalDisclaimer()
        )
    }

    private fun detectConflicts(candidates: List<OptimizationCandidate>): List<ConcurrenceConflictPair> {
        val conflicts = mutableListOf<ConcurrenceConflictPair>()

        for (i in candidates.indices) {
            for (j in i + 1 until candidates.size) {
                val a = candidates[i]
                val b = candidates[j]
                val rel = getPairwiseRelationship(a.classification, b.classification)

                if (rel == ConcurrenceRelationship.MUTUALLY_EXCLUSIVE) {
                    val msg = when {
                        a.classification == SchemeFundingClassification.CENTRAL_MERIT &&
                                b.classification == SchemeFundingClassification.CENTRAL_MERIT ->
                            "NSP permits submitting only 1 Central Merit application per academic year. \"${a.name}\" and \"${b.name}\" are mutually exclusive."
                        (a.classification == SchemeFundingClassification.CENTRAL_WELFARE && b.classification == SchemeFundingClassification.STATE_POST_MATRIC) ||
                                (b.classification == SchemeFundingClassification.CENTRAL_WELFARE && a.classification == SchemeFundingClassification.STATE_POST_MATRIC) ->
                            "Both \"${a.name}\" and \"${b.name}\" provide complete tuition reimbursement. Claiming tuition from both Central and State budgets violates GFR 230(1)."
                        else -> "\"${a.name}\" and \"${b.name}\" cannot be concurrently held."
                    }
                    conflicts.add(ConcurrenceConflictPair(a.code, b.code, rel, msg))
                } else if (rel == ConcurrenceRelationship.DUAL_APPLY_SINGLE_DISBURSE) {
                    conflicts.add(
                        ConcurrenceConflictPair(
                            a.code,
                            b.code,
                            rel,
                            "NSP AY 2026–27 permits applying to both \"${a.name}\" (Merit) and \"${b.name}\" (Welfare) to maximize your chances. However, if awarded both, you must surrender one prior to final disbursement."
                        )
                    )
                }
            }
        }
        return conflicts
    }

    private fun getPairwiseRelationship(
        classA: SchemeFundingClassification,
        classB: SchemeFundingClassification
    ): ConcurrenceRelationship {
        if (classA == SchemeFundingClassification.CENTRAL_MERIT && classB == SchemeFundingClassification.CENTRAL_MERIT) {
            return ConcurrenceRelationship.MUTUALLY_EXCLUSIVE
        }
        if ((classA == SchemeFundingClassification.CENTRAL_MERIT && classB == SchemeFundingClassification.CENTRAL_WELFARE) ||
            (classA == SchemeFundingClassification.CENTRAL_WELFARE && classB == SchemeFundingClassification.CENTRAL_MERIT)
        ) {
            return ConcurrenceRelationship.DUAL_APPLY_SINGLE_DISBURSE
        }
        if ((classA == SchemeFundingClassification.CENTRAL_WELFARE && classB == SchemeFundingClassification.STATE_POST_MATRIC) ||
            (classA == SchemeFundingClassification.STATE_POST_MATRIC && classB == SchemeFundingClassification.CENTRAL_WELFARE)
        ) {
            return ConcurrenceRelationship.MUTUALLY_EXCLUSIVE
        }
        if (classA == SchemeFundingClassification.PHILANTHROPIC_STACKABLE || classB == SchemeFundingClassification.PHILANTHROPIC_STACKABLE) {
            return ConcurrenceRelationship.STACKABLE_GAP_FUNDING
        }
        return ConcurrenceRelationship.MUTUALLY_EXCLUSIVE
    }

    private fun generateDualApplicationGuidance(candidates: List<OptimizationCandidate>): List<String> {
        val guidance = mutableListOf<String>()
        val hasMerit = candidates.any { it.classification == SchemeFundingClassification.CENTRAL_MERIT }
        val hasWelfare = candidates.any { it.classification == SchemeFundingClassification.CENTRAL_WELFARE }

        if (hasMerit && hasWelfare) {
            guidance.add(
                "NSP AY 2026–27 permits applying for both 1 Central Merit and 1 Central Welfare scheme on the portal to maximize your selection odds. However, DBT de-duplication rules require that you surrender one before final disbursement."
            )
        }

        val hasPhilanthropic = candidates.any { it.classification == SchemeFundingClassification.PHILANTHROPIC_STACKABLE }
        if (hasPhilanthropic && (hasMerit || hasWelfare)) {
            guidance.add(
                "Private philanthropic foundation grants (e.g. Reliance Foundation) can be stacked with government scholarships as gap funding for living expenses, books, and laptops, provided total aid does not exceed verified institutional fees."
            )
        }
        return guidance
    }

    private fun findOptimalBundle(
        candidates: List<OptimizationCandidate>,
        conflicts: List<ConcurrenceConflictPair>,
        target: String
    ): List<OptimizationCandidate> {
        val exclusivePairs = mutableSetOf<String>()
        for (c in conflicts) {
            if (c.relationship == ConcurrenceRelationship.MUTUALLY_EXCLUSIVE ||
                c.relationship == ConcurrenceRelationship.DUAL_APPLY_SINGLE_DISBURSE
            ) {
                exclusivePairs.add("${c.scholarshipCodeA}__${c.scholarshipCodeB}")
                exclusivePairs.add("${c.scholarshipCodeB}__${c.scholarshipCodeA}")
            }
        }

        val n = candidates.size
        var bestBundle: List<OptimizationCandidate> = emptyList()
        var bestScore = -1L
        var bestSecondaryScore = -1L

        val totalCombinations = 1 shl n

        for (mask in 1 until totalCombinations) {
            val currentSubset = mutableListOf<OptimizationCandidate>()
            var isFeasible = true
            var centralCount = 0

            for (i in 0 until n) {
                if ((mask and (1 shl i)) != 0) {
                    val item = candidates[i]

                    if (item.classification == SchemeFundingClassification.CENTRAL_MERIT ||
                        item.classification == SchemeFundingClassification.CENTRAL_WELFARE
                    ) {
                        centralCount++
                        if (centralCount > 1) {
                            isFeasible = false
                            break
                        }
                    }

                    for (selected in currentSubset) {
                        if (exclusivePairs.contains("${item.code}__${selected.code}")) {
                            isFeasible = false
                            break
                        }
                    }

                    if (!isFeasible) break
                    currentSubset.add(item)
                }
            }

            if (!isFeasible) continue

            val rawSum = currentSubset.sumOf { it.annualBenefitInr }
            val expectedYieldSum = currentSubset.sumOf { (it.annualBenefitInr * it.competitivenessWeight).toLong() }

            val primaryScore = if (target == "MAX_EXPECTED_YIELD") expectedYieldSum else rawSum
            val secondaryScore = if (target == "MAX_EXPECTED_YIELD") rawSum else expectedYieldSum

            if (primaryScore > bestScore || (primaryScore == bestScore && secondaryScore > bestSecondaryScore)) {
                bestScore = primaryScore
                bestSecondaryScore = secondaryScore
                bestBundle = currentSubset
            }
        }

        return bestBundle
    }

    private fun getLegalDisclaimer(): String {
        return "ScholarBridge grant optimization calculations are deterministic advisory recommendations based on AY 2026–27 published scheme circulars and DBT Bharat directives. Final sanction and disbursement remain subject to institutional scrutiny, nodal officer verification, and statutory de-duplication."
    }
}
