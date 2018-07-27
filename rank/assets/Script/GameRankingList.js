cc.Class({
    extends: cc.Component,

    properties: {
        rankingScrollView: {
            default: null,
            type: cc.ScrollView,
        },
        scrollViewContent: {
            default: null,
            type: cc.Node,
        },
        prefabRankItem: {
            default: null,
            type: cc.Prefab,
        },
        prefabGameOverRank: {
            default: null,
            type: cc.Prefab,
        },
        gameOverRankView: {
            default: null,
            type: cc.Node,
        },
        gameOverRankLayout: {
            default: null,
            type: cc.Node,
        },
        loadingLabel: {
            default: null,
            type: cc.Node,
        },
        scoreLabel: {
            default: null,
            type: cc.Node,
        },

        levelNums: 0,
    },
    
    start() {
        this.removeChild();
        if (CC_WECHATGAME) {
            window.wx.onMessage(data => {
                this.levelNums = data.levelNums;
                if (data.messageType === 'post') {
                    // 结束界面与胜利界面
                    this.submitScoreGameOverRank(data.gameNo, data.score);
                } 
                else if (data.messageType === 'rank') {
                    // 获取好友排行榜
                    this.fetchFriendData(data.gameNo);
                }
            });
        }
    },

    submitScoreGameOverRank(gameNo, score) { //提交得分
        score = Math.ceil(score);
        this.scoreLabel.getComponent('cc.Label').string = '第' + (parseInt(gameNo) + 1).toString() + '关，此次得分：' + score.toString();
        if (CC_WECHATGAME) {
            window.wx.getUserCloudStorage({
                // 以key/value形式存储
                keyList: [gameNo],
                success: function (getres) {
                    if (getres.KVDataList.length != 0 && getres.KVDataList[0].value > score) {
                        score = getres.KVDataList[0].value;
                    }
                    else {
                        // 对用户托管数据进行写数据操作
                        window.wx.setUserCloudStorage({
                            KVDataList: [{key: gameNo, value: score.toString()}]
                        });
                    }
                }
            });
        }
        this.removeChild();
        this.gameOverRankView.active = true;
        this.loadingLabel.getComponent(cc.Label).string = "排行榜加载中……";
        if (CC_WECHATGAME) {
            wx.getUserInfo({
                openIdList: ['selfOpenId'],
                success: (userRes) => {
                    let userData = userRes.data[0];
                    //取出所有好友数据
                    wx.getFriendCloudStorage({
                        keyList: [gameNo],
                        success: res => {
                            let data = res.data;
                            data.sort((a, b) => {
                                if (a.KVDataList.length == 0 && b.KVDataList.length == 0) {
                                    return 0;
                                }
                                if (a.KVDataList.length == 0) {
                                    return 1;
                                }
                                if (b.KVDataList.length == 0) {
                                    return -1;
                                }
                                return b.KVDataList[0].value - a.KVDataList[0].value;
                            });
                            for (let i = 0; i < data.length; i++) {
                                if (data[i].avatarUrl == userData.avatarUrl) {
                                    if ((i - 1) >= 0) {
                                        if ((i + 1) >= data.length && (i - 2) >= 0) {
                                            let userItem = cc.instantiate(this.prefabGameOverRank);
                                            userItem.getComponent('GameOverRank').init(i - 2, data[i - 2]);
                                            this.gameOverRankLayout.addChild(userItem);
                                        }
                                        let userItem = cc.instantiate(this.prefabGameOverRank);
                                        userItem.getComponent('GameOverRank').init(i - 1, data[i - 1]);
                                        this.gameOverRankLayout.addChild(userItem);
                                    } else {
                                        if ((i + 2) >= data.length) {
                                            let node = new cc.Node();
                                            node.width = 200;
                                            this.gameOverRankLayout.addChild(node);
                                        }
                                    }
                                    let userItem = cc.instantiate(this.prefabGameOverRank);
                                    userItem.getComponent('GameOverRank').init(i, data[i], true);
                                    this.gameOverRankLayout.addChild(userItem);
                                    if ((i + 1) < data.length) {
                                        let userItem = cc.instantiate(this.prefabGameOverRank);
                                        userItem.getComponent('GameOverRank').init(i + 1, data[i + 1]);
                                        this.gameOverRankLayout.addChild(userItem);
                                        if ((i - 1) < 0 && (i + 2) < data.length) {
                                            let userItem = cc.instantiate(this.prefabGameOverRank);
                                            userItem.getComponent('GameOverRank').init(i + 2, data[i + 2]);
                                            this.gameOverRankLayout.addChild(userItem);
                                        }
                                    }
                                    break;
                                }
                            }
                            this.loadingLabel.active = false;
                        },
                        fail: res => {
                            this.loadingLabel.getComponent(cc.Label).string = "数据加载失败，请检测网络";
                        },
                    });
                },
                fail: (res) => {
                    this.loadingLabel.getComponent(cc.Label).string = "数据加载失败，请检测网络";
                }
            });
        }
    },

    removeChild() {
        this.node.removeChildByTag(1000);
        this.rankingScrollView.node.active = false;
        this.scrollViewContent.removeAllChildren();
        this.gameOverRankView.active = false;
        this.gameOverRankLayout.removeAllChildren();
        this.loadingLabel.getComponent(cc.Label).string = "玩命加载中...";
        this.loadingLabel.active = true;
    },

    fetchFriendData(gameNo) {
        this.removeChild();
        this.rankingScrollView.node.active = true;
        if (CC_WECHATGAME) {
            wx.getUserInfo({
                openIdList: ['selfOpenId'],
                success: (userRes) => {
                    let userData = userRes.data[0];
                    //取出所有好友数据
                    wx.getFriendCloudStorage({
                        keyList: [gameNo],
                        success: res => {
                            console.log("wx.getFriendCloudStorage success", res);
                            let data = res.data;
                            data.sort((a, b) => {
                                if (a.KVDataList.length == 0 && b.KVDataList.length == 0) {
                                    return 0;
                                }
                                if (a.KVDataList.length == 0) {
                                    return 1;
                                }
                                if (b.KVDataList.length == 0) {
                                    return -1;
                                }
                                return b.KVDataList[0].value - a.KVDataList[0].value;
                            });
                            for (let i = 0; i < data.length; i++) {
                                var playerInfo = data[i];
                                var item = cc.instantiate(this.prefabRankItem);
                                item.getComponent('RankItem').init(i, playerInfo);
                                this.scrollViewContent.addChild(item);
                                if (data[i].avatarUrl == userData.avatarUrl) {
                                    let userItem = cc.instantiate(this.prefabRankItem);
                                    userItem.getComponent('RankItem').init(i, playerInfo);
                                    userItem.y = -354;
                                    this.node.addChild(userItem, 1, 1000);
                                }
                            }
                            if (data.length <= 8) {
                                let layout = this.scrollViewContent.getComponent(cc.Layout);
                                layout.resizeMode = cc.Layout.ResizeMode.NONE;
                            }
                        },
                        fail: res => {
                            this.loadingLabel.getComponent(cc.Label).string = "数据加载失败，请检测网络";
                        },
                    });
                    this.loadingLabel.active = false;
                },
                fail: (res) => {
                    this.loadingLabel.getComponent(cc.Label).string = "数据加载失败，请检测网络";
                }
            });
        }
    },
});
