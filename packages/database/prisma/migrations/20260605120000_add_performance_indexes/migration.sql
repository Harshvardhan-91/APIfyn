-- CreateIndex
CREATE INDEX "integrations_userId_type_idx" ON "integrations"("userId", "type");

-- CreateIndex
CREATE INDEX "workflows_userId_isActive_idx" ON "workflows"("userId", "isActive");

-- CreateIndex
CREATE INDEX "workflows_userId_createdAt_idx" ON "workflows"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "workflows_status_idx" ON "workflows"("status");

-- CreateIndex
CREATE INDEX "workflow_executions_workflowId_startedAt_idx" ON "workflow_executions"("workflowId", "startedAt");

-- CreateIndex
CREATE INDEX "workflow_executions_userId_status_idx" ON "workflow_executions"("userId", "status");

-- CreateIndex
CREATE INDEX "workflow_executions_status_startedAt_idx" ON "workflow_executions"("status", "startedAt");
