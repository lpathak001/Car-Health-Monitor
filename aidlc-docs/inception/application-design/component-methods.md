# Component Method Signatures

*Note: Detailed business rules and implementation logic will be defined later in Functional Design phase*

## Mobile Application Component Methods

### Dashboard Component Methods

```typescript
interface DashboardComponent {
  // Health data display methods
  loadHealthDashboard(vehicleId: string): Promise<HealthDashboard>
  refreshHealthData(vehicleId: string): Promise<void>
  displayHealthGauges(healthData: HealthMetrics): void
  renderTrendCharts(sensorData: SensorTrend[]): void
  
  // User interaction methods
  onHealthScoreClick(subsystem: string): void
  onRefreshRequested(): Promise<void>
  onAlertClick(alertId: string): void
}

interface HealthDashboard {
  vehicleId: string
  overallHealthScore: number
  subsystemScores: SubsystemHealth[]
  recentAlerts: Alert[]
  lastUpdated: Date
}
```

### Alerts Component Methods

```typescript
interface AlertsComponent {
  // Alert display methods
  loadAlerts(userId: string): Promise<Alert[]>
  displayAlert(alert: Alert): void
  showAlertDetails(alertId: string): Promise<AlertDetails>
  
  // Alert management methods
  acknowledgeAlert(alertId: string): Promise<void>
  dismissAlert(alertId: string): Promise<void>
  filterAlerts(criteria: AlertFilter): Alert[]
  
  // Notification methods
  registerForPushNotifications(): Promise<string>
  handlePushNotification(notification: PushNotification): void
}
```

### Vehicle Component Methods

```typescript
interface VehicleComponent {
  // Vehicle management methods
  loadVehicleProfile(vehicleId: string): Promise<VehicleProfile>
  updateVehicleInfo(vehicleId: string, updates: VehicleUpdate): Promise<void>
  registerVehicle(vehicleData: VehicleRegistration): Promise<string>
  
  // Sensor data methods
  startSensorDataCollection(vehicleId: string): Promise<void>
  stopSensorDataCollection(vehicleId: string): Promise<void>
  getSensorStatus(vehicleId: string): Promise<SensorStatus>
  
  // Settings methods
  updateVehicleSettings(vehicleId: string, settings: VehicleSettings): Promise<void>
}
```

### Profile Component Methods

```typescript
interface ProfileComponent {
  // User profile methods
  loadUserProfile(userId: string): Promise<UserProfile>
  updateProfile(userId: string, updates: ProfileUpdate): Promise<void>
  changePassword(currentPassword: string, newPassword: string): Promise<void>
  
  // Settings methods
  loadAppSettings(userId: string): Promise<AppSettings>
  updateSettings(userId: string, settings: AppSettings): Promise<void>
  
  // Account methods
  deleteAccount(userId: string): Promise<void>
  exportUserData(userId: string): Promise<UserDataExport>
}
```

## Backend Microservice Methods

### Authentication Service Methods

```typescript
interface AuthenticationService {
  // Authentication methods
  register(userData: UserRegistration): Promise<AuthResult>
  login(credentials: LoginCredentials): Promise<AuthResult>
  logout(token: string): Promise<void>
  refreshToken(refreshToken: string): Promise<TokenPair>
  
  // Token management methods
  validateToken(token: string): Promise<TokenValidation>
  revokeToken(token: string): Promise<void>
  
  // Password methods
  resetPassword(email: string): Promise<void>
  changePassword(userId: string, passwordChange: PasswordChange): Promise<void>
}
```

### Vehicle Management Service Methods

```typescript
interface VehicleManagementService {
  // Vehicle CRUD methods
  createVehicle(userId: string, vehicleData: VehicleData): Promise<string>
  getVehicle(vehicleId: string): Promise<Vehicle>
  updateVehicle(vehicleId: string, updates: VehicleUpdate): Promise<void>
  deleteVehicle(vehicleId: string): Promise<void>
  
  // User-vehicle association methods
  associateVehicleWithUser(userId: string, vehicleId: string): Promise<void>
  getUserVehicles(userId: string): Promise<Vehicle[]>
  
  // Manufacturer integration methods
  syncWithManufacturerAPI(vehicleId: string): Promise<ManufacturerData>
  getManufacturerData(vin: string): Promise<VehicleSpecs>
}
```

### Sensor Data Service Methods

```typescript
interface SensorDataService {
  // Data ingestion methods
  ingestSensorData(vehicleId: string, sensorData: SensorReading[]): Promise<void>
  validateSensorData(sensorData: SensorReading[]): ValidationResult
  preprocessSensorData(rawData: RawSensorData): ProcessedSensorData
  
  // Data retrieval methods
  getSensorData(vehicleId: string, timeRange: TimeRange): Promise<SensorData[]>
  getLatestSensorData(vehicleId: string): Promise<SensorData>
  getSensorTrends(vehicleId: string, metric: string, period: TimePeriod): Promise<TrendData>
  
  // Data management methods
  archiveOldData(cutoffDate: Date): Promise<void>
  exportSensorData(vehicleId: string, format: ExportFormat): Promise<DataExport>
}
```

### Health Analysis Service Methods

```typescript
interface HealthAnalysisService {
  // Health analysis orchestration methods
  analyzeVehicleHealth(vehicleId: string): Promise<HealthAnalysis>
  requestMLAnalysis(vehicleId: string, sensorData: SensorData[]): Promise<MLAnalysisResult>
  generateHealthReport(vehicleId: string, period: TimePeriod): Promise<HealthReport>
  
  // Health scoring methods
  calculateHealthScore(vehicleId: string): Promise<HealthScore>
  getHealthTrends(vehicleId: string, period: TimePeriod): Promise<HealthTrend[]>
  
  // Predictive maintenance methods
  generateMaintenanceRecommendations(vehicleId: string): Promise<MaintenanceRecommendation[]>
  scheduleMaintenanceReminder(vehicleId: string, reminder: MaintenanceReminder): Promise<void>
}
```

### Alert Management Service Methods

```typescript
interface AlertManagementService {
  // Alert generation methods
  processAnomalyResults(vehicleId: string, anomalies: AnomalyResult[]): Promise<void>
  generateAlert(vehicleId: string, anomaly: AnomalyResult): Promise<string>
  
  // Alert management methods
  getAlerts(userId: string, filter?: AlertFilter): Promise<Alert[]>
  acknowledgeAlert(alertId: string, userId: string): Promise<void>
  dismissAlert(alertId: string, userId: string): Promise<void>
  
  // Notification methods
  sendPushNotification(userId: string, alert: Alert): Promise<void>
  sendEmailNotification(userId: string, alert: Alert): Promise<void>
  
  // Alert configuration methods
  updateAlertPreferences(userId: string, preferences: AlertPreferences): Promise<void>
}
```

## ML Service Component Methods

### Anomaly Detection Engine Methods

```python
class AnomalyDetectionEngine:
    # Analysis methods
    def detect_anomalies(self, vehicle_id: str, sensor_data: List[SensorReading]) -> AnomalyResult
    def analyze_patterns(self, sensor_data: List[SensorReading]) -> PatternAnalysis
    def classify_anomaly(self, anomaly_data: AnomalyData) -> AnomalyClassification
    
    # Model methods
    def load_model(self, vehicle_type: str) -> MLModel
    def predict_anomaly_score(self, features: FeatureVector) -> float
    def update_model(self, training_data: TrainingData) -> None
```

### Health Scoring Service Methods

```python
class HealthScoringService:
    # Scoring methods
    def calculate_health_score(self, vehicle_id: str, anomaly_scores: List[AnomalyScore]) -> HealthScore
    def calculate_subsystem_score(self, subsystem: str, sensor_data: List[SensorReading]) -> float
    def generate_health_trend(self, vehicle_id: str, time_period: TimePeriod) -> HealthTrend
    
    # Analysis methods
    def analyze_health_factors(self, health_data: HealthData) -> HealthFactorAnalysis
    def predict_health_trajectory(self, vehicle_id: str) -> HealthPrediction
```

### Model Management Service Methods

```python
class ModelManagementService:
    # Model lifecycle methods
    def deploy_model(self, model_id: str, version: str) -> DeploymentResult
    def rollback_model(self, model_id: str, previous_version: str) -> None
    def retire_model(self, model_id: str) -> None
    
    # Training methods
    def train_model(self, training_config: TrainingConfig) -> TrainingResult
    def evaluate_model(self, model_id: str, test_data: TestData) -> ModelMetrics
    def compare_models(self, model_a: str, model_b: str) -> ModelComparison
```

## Data Repository Methods

### User Data Repository Methods

```typescript
interface UserDataRepository {
  // User CRUD methods
  createUser(userData: UserData): Promise<string>
  getUserById(userId: string): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  updateUser(userId: string, updates: UserUpdate): Promise<void>
  deleteUser(userId: string): Promise<void>
  
  // Authentication data methods
  storePasswordHash(userId: string, passwordHash: string): Promise<void>
  validatePassword(userId: string, password: string): Promise<boolean>
  
  // Settings methods
  getUserSettings(userId: string): Promise<UserSettings>
  updateUserSettings(userId: string, settings: UserSettings): Promise<void>
}
```

### Vehicle Data Repository Methods

```typescript
interface VehicleDataRepository {
  // Vehicle CRUD methods
  createVehicle(vehicleData: VehicleData): Promise<string>
  getVehicleById(vehicleId: string): Promise<Vehicle | null>
  updateVehicle(vehicleId: string, updates: VehicleUpdate): Promise<void>
  deleteVehicle(vehicleId: string): Promise<void>
  
  // Association methods
  associateVehicleWithUser(userId: string, vehicleId: string): Promise<void>
  getUserVehicles(userId: string): Promise<Vehicle[]>
  
  // Metadata methods
  storeVehicleMetadata(vehicleId: string, metadata: VehicleMetadata): Promise<void>
  getVehicleSpecs(vin: string): Promise<VehicleSpecs | null>
}
```

### Sensor Data Repository Methods

```typescript
interface SensorDataRepository {
  // Data ingestion methods
  insertSensorData(vehicleId: string, sensorData: SensorReading[]): Promise<void>
  insertBatchSensorData(batchData: BatchSensorData): Promise<void>
  
  // Data retrieval methods
  getSensorData(vehicleId: string, timeRange: TimeRange, metrics?: string[]): Promise<SensorData[]>
  getLatestSensorData(vehicleId: string): Promise<SensorData | null>
  getAggregatedData(vehicleId: string, aggregation: AggregationConfig): Promise<AggregatedData[]>
  
  // Data management methods
  archiveData(cutoffDate: Date): Promise<number>
  deleteVehicleData(vehicleId: string): Promise<void>
}
```

### Health Data Repository Methods

```typescript
interface HealthDataRepository {
  // Health score methods
  storeHealthScore(vehicleId: string, healthScore: HealthScore): Promise<void>
  getHealthScore(vehicleId: string): Promise<HealthScore | null>
  getHealthHistory(vehicleId: string, period: TimePeriod): Promise<HealthScore[]>
  
  // Anomaly methods
  storeAnomalyResult(vehicleId: string, anomaly: AnomalyResult): Promise<string>
  getAnomalies(vehicleId: string, filter?: AnomalyFilter): Promise<AnomalyResult[]>
  
  // Alert methods
  storeAlert(alert: Alert): Promise<string>
  getAlerts(userId: string, filter?: AlertFilter): Promise<Alert[]>
  updateAlertStatus(alertId: string, status: AlertStatus): Promise<void>
}
```