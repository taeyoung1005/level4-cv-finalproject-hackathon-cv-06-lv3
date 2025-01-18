import torch
from sklearn.metrics import root_mean_squared_error, mean_absolute_error, r2_score
import numpy as np

class simpleNN_model(torch.nn.Module):
    def __init__(self,input_size,output_size=1):
        super(simpleNN_model,self).__init__()
        self.fc1 = torch.nn.Linear(input_size,16)
        self.fc2 = torch.nn.Linear(16,32)
        self.fc3 = torch.nn.Linear(32,output_size)

    def forward(self,x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        return x
    

def simpleNN_train(train_loader,val_loader):

    model = simpleNN_model(input_size=train_loader.dataset.X.shape[1])
    optimizer = torch.optim.Adam(model.parameters(),lr=0.001)
    loss_fn = torch.nn.MSELoss()

    for epoch in range(epochs:=200):
        loss = 0
        for data,target in train_loader:
            optimizer.zero_grad()
            output = model(data)
            loss = loss_fn(output,target)
            loss.backward()
            optimizer.step()
            loss += loss.item()
        
        if epoch % 10 == 0:
            print(f"Epoch {epoch}, Loss: {loss/len(train_loader):.4f}")

            val_loss = 0
            for data,target in val_loader:
                output = model(data)
                loss = loss_fn(output,target)
                val_loss += loss.item()
            print(f"Validation Loss: {val_loss/len(val_loader):.4f}")

    return model

def simpleNN_evaluate(model,train_loader,test_loader):

    y_mean = train_loader.dataset.y.mean()
    
    model.eval()
    # loss_fn = torch.nn.MSELoss()

    with torch.no_grad():
        SSE = 0
        SST = 0
        for data,target in test_loader:
            output = model(data)
            output = output.numpy()
            target = target.numpy()
            # print(output.shape)
            # print(target.shape)
            SSE += np.sum((target - output)**2)
            SST += np.sum((target - y_mean)**2)
            # print(((target - output).shape))
            # print(((target - y_mean).shape))
        
        # print(SSE)
        # print(SST)

        r2 = 1 - SSE/SST
        rmse = np.sqrt(SSE/len(test_loader))
        mae = np.mean(np.abs(target - output))

    return rmse, mae, r2

def simpleNN_predict(model,X_test):
    model.eval()
    with torch.no_grad():
        output = model(X_test)
    return output