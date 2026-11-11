// REFERENCE IaC ONLY - not used by deploy.sh in this environment.
//
// deploy.sh creates the same resources with plain `az` CLI commands,
// because `az deployment group create --template-file *.bicep` triggers
// an automatic Bicep CLI download from GitHub, which is unreliable on
// this network. Keep this file as the declarative target: once Bicep CLI
// is installed (`az bicep install`), switch deploy.sh back to a template
// deployment for proper infrastructure-as-code and drift detection.
//
// Development / research prototype only. Deploys a Linux Consumption
// Function App plus the minimum supporting resources. No database,
// no user data persistence, no AI model quota. Running cost on a
// pay-as-you-go subscription: near zero for light dev traffic.

@description('Azure region for the dev prototype')
param location string = 'eastus'

@description('Base name used to derive resource names')
param appName string = 'doctoral-toolbox'

@description('Allowed browser origin for the API (replace with your real domain)')
param allowedOrigin string = 'https://yourdomain.com'

var suffix = substring(uniqueString(resourceGroup().id), 0, 6)
var cleanName = toLower(replace(appName, '-', ''))
var storageName = 'st${cleanName}${suffix}'
var planName = 'plan-${appName}-${suffix}'
var funcName = 'func-${appName}-${suffix}'
var workspaceName = 'log-${appName}-${suffix}'
var insightsName = 'appi-${appName}-${suffix}'

resource workspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: workspaceName
  location: location
  sku: { name: 'PerGB2018' }
  properties: {
    retentionInDays: 30
    features: { searchVersion: 1, legacy: 0, enableLogAccessUsingOnlyResourcePermissions: true }
  }
}

resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: insightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
  }
}

resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
  }
}

resource plan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: planName
  location: location
  sku: { name: 'Y1', tier: 'Dynamic' }
  properties: {
    computeMode: 'Dynamic'
    reserved: true
  }
}

resource func 'Microsoft.Web/sites@2022-09-01' = {
  name: funcName
  location: location
  kind: 'functionapp,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: plan.id
    reserved: true
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20'
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      http20Enabled: true
      cors: {
        allowedOrigins: [allowedOrigin, 'http://localhost:8080', 'http://127.0.0.1:8080']
        supportCredentials: false
      }
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: insights.properties.ConnectionString }
        { name: 'MAX_ENTRIES', value: '200' }
      ]
    }
  }
}

output functionAppName string = func.name
output functionAppHost string = func.properties.defaultHostName
output healthUrl string = 'https://${func.properties.defaultHostName}/api/health'
output parseUrl string = 'https://${func.properties.defaultHostName}/api/parse'
output resourceGroup string = resourceGroup().name
