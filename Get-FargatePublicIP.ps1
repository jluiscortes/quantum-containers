# Configura tus valores
$clusterName = "quantum-cluster"
$serviceName = "quantum-service"

# Paso 1: Obtener la primera tarea activa
$taskArn = aws ecs list-tasks `
    --cluster $clusterName `
    --service-name $serviceName `
    --desired-status RUNNING `
    --query "taskArns[0]" `
    --output text

if (-not $taskArn -or $taskArn -eq "None") {
    Write-Host "❌ No hay tareas activas en ejecución." -ForegroundColor Red
    exit
}

Write-Host "`n🔍 Obteniendo ENI de la tarea: $taskArn"

# Paso 2: Obtener ENI (network interface id)
$eniId = aws ecs describe-tasks `
    --cluster $clusterName `
    --tasks $taskArn `
    --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" `
    --output text

Write-Host "🔌 ENI encontrado: $eniId"

# Paso 3: Obtener IP pública asociada
$publicIp = aws ec2 describe-network-interfaces `
    --network-interface-ids $eniId `
    --query "NetworkInterfaces[0].Association.PublicIp" `
    --output text

Write-Host "`n🌐 Dirección IP pública disponible en Fargate:"
Write-Host "👉 http://$publicIp:3000/" -ForegroundColor Green
