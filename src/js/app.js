App = {
    web3Provider: null, 
    contracts: {},
    account: "0x0",
    loading: false,
    tokenPrice: 1000000000000000,
    tokensSold: 0,
    tokensAvailable: 750000,
    balance: 0,

    init: async () => {
        console.log("App initialized...");
        return await App.initWeb3();
    },

    initWeb3: async () => {
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                await window.ethereum.enable();
            } catch (error) {
                console.error("User denied account access");
            }
        } else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        } else {
            App.web3Provider = new Web3.providers.HttpProvider("http://localhost:7545");
        }
        web3 = new Web3(App.web3Provider);

        return App.initContracts();
    },

    initContracts: () => {
        $.getJSON("DappTokenSale.json", (data) => {
            App.contracts.DappTokenSale = TruffleContract(data);
            App.contracts.DappTokenSale.setProvider(App.web3Provider);
            App.contracts.DappTokenSale.deployed().then((dappTokenSale) => {
                console.log("Dapp Token Sale Address:", dappTokenSale.address);
            });
        }).done(() => {
            $.getJSON("DappToken.json", (data) => {
                App.contracts.DappToken = TruffleContract(data);
                App.contracts.DappToken.setProvider(App.web3Provider);
                App.contracts.DappToken.deployed().then((dappToken) => {
                    console.log("Dapp Token Address:", dappToken.address);
                });

                return App.render();
            });
        });
    },

    render: () => {
        // Don't re-render if already up to date
        if (App.loading) {
            return;
        }
        App.loading = true;

        let loader = $("#loader");
        let content = $("#content");

        loader.show();
        content.hide();

        // Load account data
        web3.eth.getCoinbase((err, account) => {
            if (err === null) {
                App.account = account;
                $("#accountAddress").html("Your account: " + account);
            }
        });

        // Load token sale contract
        App.contracts.DappTokenSale.deployed().then((instance) => {
            dappTokenSaleInstance = instance;
            return dappTokenSaleInstance.tokenPrice();
        }).then((tokenPrice) => {
            App.tokenPrice = tokenPrice;
            $(".token-price").html(web3.fromWei(App.tokenPrice, "ether").toNumber());
            return dappTokenSaleInstance.tokensSold();
        }).then((tokensSold) => {
            App.tokensSole = tokensSold.toNumber();
            $(".tokens-sold").html(App.tokensSold);
            $(".tokens-available").html(App.tokensAvailable);

            let progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
            $("#progress").css("width", progressPercent + "%");

            // Load Token contract
            App.contracts.DappToken.deployed().then((instance) => {
                dappTokenInstance = instance;
                return dappTokenInstance.balanceOf(App.account);
            }).then((balance) => {
                $(".dapp-balance").html(balance.toNumber());

                App.loading = false;
                loader.hide();
                content.show();
            });
        });
    },

    buyTokens: () => {
        $("#content").hide();
        $("#loader").show();
        
        let numberOfTokens = $("#numberOfTokens").val();
        App.contracts.DappTokenSale.deployed().then((instance) => {
            return instance.buyTokens(numberOfTokens, { 
                from: App.account,
                value: numberOfTokens * App.tokenPrice,
                gas: 500000
            });
        }).then((result) => {
            console.log("Tokens bought");
            $("form").trigger("reset");
            $("#loader").hide();
            $("#content").show();
        });
    }
}

$(() => {
    $(window).load(() => {
        App.init();
    });
});
