from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, log_loss

def eval_classification_model(y_true, y_pred, y_prob=None, average='macro'):
    """
    분류 모델 평가 함수
    - y_true: 실제 레이블 (0 또는 1, 혹은 다중 클래스 정답)
    - y_pred: 예측된 레이블 (0 또는 1, 혹은 다중 클래스 예측값)
    - y_prob: 확률 값 (AUC 계산을 위해 필요, 없으면 None)
    - average: 'macro', 'micro', 'weighted' 중 선택 가능 (다중 클래스의 경우)
    """
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, average=average, zero_division=0)
    rec = recall_score(y_true, y_pred, average=average, zero_division=0)
    f1 = f1_score(y_true, y_pred, average=average)
    
    auc = None
    if y_prob is not None and len(set(y_true)) > 1:  # AUC는 2개 이상의 클래스가 있어야 계산 가능
        auc = roc_auc_score(y_true, y_prob, multi_class="ovr", average=average)

    logloss = None
    if y_prob is not None:
        logloss = log_loss(y_true, y_prob)

    return acc, prec,rec, f1, auc, logloss
