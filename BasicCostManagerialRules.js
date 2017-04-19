/**
 * @author Neal Dong
 * refactor 2017.02.24
 */
H.ns("com.oocl.ir4.sps.web.js.profile.office");

com.oocl.ir4.sps.web.js.profile.office.BasicCostManagerialRules = Ext
    .extend(com.oocl.ir4.sps.framework.web.js.commonUI.Panel, {
        constructor: function(config) {
            this.clientWindowId = config.clientWindowId;
            this.constants = SPSAuthConstants;
            this.helper = com.oocl.ir4.sps.web.common.authorization.AuthorityHelper;
            this.officeId = config.officeId;
            this.isAXALTA = userCompanyName === CompanyConstants.AXALTA;
            this.tabIndex = 2;
            Ext.apply(config, {
                defaults: {
                    layout: 'form',
                    defaults: {
                        anchor: '100%'
                    }
                },
                items: [
                    this._getJobCostRulePanel(),
                    this._getCostTriggeringRulePanel(),
                    this._getRoundRulePanel(),
                    this._getArApApprovalProcessRulePanel(),
                    this._getVatRulePanel(),
                    this._getInsuranceFeePanel(), {
                        xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.GroupPanel',
                        title: '代收货款',
                        items: [this._getCollectionOfGoodsPaymentRulePanel()]
                    },
                    this._getChargeItemPanel()
                ]
            });

            com.oocl.ir4.sps.web.js.profile.office.BasicCostManagerialRules.superclass.constructor
                .call(this, config);

            this.on("afterrender", Ext.createDelegate(this._onAfterRender,
                this));
        },

        isValid: function() {
            var isValid = this._getTJobCostRulePanel().getForm().isValid() && this._getNTJobCostRulePanel().getForm().isValid() && this._getCostTriggeringRulePanel().getForm().isValid() && this._getRoundRulePanel().getForm().isValid() && this._getVatRulePanel().getForm().isValid() && this._getInsuranceFeePanel().getForm().isValid();
            return isValid;
        },

        _onAfterRender: function() {
            this.isRendered = true;
            this.loadOfficeRule(this.originalOfficeRule);
        },

        loadOfficeRule: function(originalOfficeRule) {
            var costManagerialRules = originalOfficeRule.costManagerialRules;
            this._getTJobCostRulePanel().getForm().setValues(costManagerialRules.jobCostApprovalRule);
            this._getNTJobCostRulePanel().getForm().setValues(costManagerialRules.ntJobCostApprovalRule);
            this._getCostTriggeringRulePanel().getForm().setValues(costManagerialRules.costTriggeringRule);
            // this._getRoundRulePanel().getForm().setValues(costManagerialRules.jobCostApprovalRule);
            this._getRoundingIncomeForm().getForm().setValues(costManagerialRules.revRoundingRuleVo);
            this._getRoundingCostForm().getForm().setValues(costManagerialRules.jobCostApprovalRule);
            var maxApBillingReportStatus = costManagerialRules.jobCostApprovalRule.maxApBillingReportStatus;
            if (maxApBillingReportStatus > 5509) {
                Ext.getCmp('isRequireApprovalProcessForAP').setValue(true);
            }
            var isNeedInvoiceReqIssueForAr = originalOfficeRule.isNeedInvoiceReqIssueForAr;
            this._getArApApprovalProcessRulePanel().getForm().setValues({
                maxApBillingReportStatus: maxApBillingReportStatus,
                isNeedInvoiceReqIssueForAr: isNeedInvoiceReqIssueForAr
            });

            this._getVatRulePanel().getForm().setValues(originalOfficeRule.costManagerialRules.vatRule);
            this._getInsuranceFeePanel().getForm().setValues(originalOfficeRule.costManagerialRules.insuranceFeeRateVo);
            var associatedChargeItems = originalOfficeRule.costManagerialRules.associatedChargeItems;
            Ext.each(associatedChargeItems, function(item, index) {
                if (!item.sequence) {
                    item.sequence = index + 1;
                }
            })
            this._getAssociatedChargeItemGrid().store.loadData({
                root: originalOfficeRule.costManagerialRules.associatedChargeItems
            });
            var vatRateApplicable = originalOfficeRule.costManagerialRules.vatRule.vatRateApplicable;
            this._getVatRateCombo().setDisabled(!vatRateApplicable);
            this._getIsIncludeVatCombo().setDisabled(!vatRateApplicable);

            var isInsuranceFeeRateApplicable = originalOfficeRule.costManagerialRules.insuranceFeeRateVo.isInsuranceFeeRateApplicable;
            this._getInsuranceFeeFeild().setDisabled(!isInsuranceFeeRateApplicable);

            // this._getCollectionOfGoodsPaymentRulePanel().setValues(costManagerialRules.collectionOfGoodsPaymentRuleVo);
            this._setCollectionOfGoodsPaymentRulePanel(originalOfficeRule);
            // the default editable value for this column should depend on vatRule
            var columnMode = this._getAssociatedChargeItemGrid().getColumnModel();
            columnMode.getColumnById('isVatApplicable').editable = vatRateApplicable;
        },

        _setCollectionOfGoodsPaymentRulePanel: function(originalOfficeRule) {
            if (originalOfficeRule.costManagerialRules.collectionOfGoodsPaymentRuleVo.isCollectionOfGoodsPayment != true) {
                return false;
            }
            this._getCollectionOfGoodsPaymentRulePanel().setValues(originalOfficeRule.costManagerialRules.collectionOfGoodsPaymentRuleVo);
            if (originalOfficeRule.costManagerialRules.collectionOfGoodsPaymentRuleVo.isChargeByRate) {
                this._getCodRadioGroup().setValue('rate');
            } else if (originalOfficeRule.costManagerialRules.collectionOfGoodsPaymentRuleVo.isChargeByTier) {
                this._getCodRadioGroup().setValue('grade');
            }
            this._getChargeRateFeild().setValue(originalOfficeRule.costManagerialRules.collectionOfGoodsPaymentRuleVo.chargeRate);
            this._getCodRatioSettingGrid().store.loadData({
                root: originalOfficeRule.costManagerialRules.collectionOfGoodsPaymentRuleVo.goodsPaymentChargeTiers
            });
        },
        // 临时费用规则
        _getJobCostRulePanel: function() {
            return {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.GroupPanel',
                title: '临时费用规则',
                layout: 'table',
                columns: 2,
                items: [
                    this._getTJobCostRulePanel(),
                    this._getNTJobCostRulePanel()
                ]
            };
        },

        _getTJobCostRulePanel: function() {
            var formId = this.getId() + "-" + "TJobCostRuleForm";
            var form = {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.SubmitFormPanel',
                id: formId,
                border: false,
                pauseMessage: true,
                anchor: '100%',
                api: {
                    load: OfficeRuleController.readTJobCostApprovalRule,
                    submit: OfficeRuleController.updateTJobCostApprovalRule
                },
                clientWindowId: this.clientWindowId,
                items: [{
                    xtype: 'container',
                    layout: 'form',
                    labelWidth: 240,
                    items: [{
                            xtype: 'container',
                            fieldLabel: '允许添加没有运价定义的临时手工费用',
                            layout: 'table',
                            items: [{
                                xtype: 'checkbox',
                                boxLabel: '订单&运单',
                                hideLabel: true,
                                width: 100,
                                name: 'isAdHocCostAllowedForTJob',
                                hiddenName: 'isAdHocCostAllowedForTJob'
                            }]
                        }

                    ]
                }]
            };

            this._getTJobCostRulePanel = function() {
                return this.findById(formId);
            };
            return form;
        },

        _getNTJobCostRulePanel: function() {
            var formId = this.getId() + "-" + "NTJobCostRuleForm";
            var form = {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.SubmitFormPanel',
                id: formId,
                border: false,
                pauseMessage: true,
                api: {
                    load: OfficeRuleController.readNtJobCostApprovalRule,
                    submit: OfficeRuleController.updateNtJobCostApprovalRule
                },
                clientWindowId: this.clientWindowId,
                items: [{
                    xtype: 'container',
                    layout: 'form',
                    style: {
                        marginTop: -3
                    },
                    items: [{
                        xtype: 'checkbox',
                        boxLabel: '杂项运单',
                        anchor: '100%',
                        hideLabel: true,
                        name: 'isAdHocCostAllowedForNTJob',
                        hiddenName: 'isAdHocCostAllowedForNTJob'
                    }]
                }]
            };
            this._getNTJobCostRulePanel = function() {
                return this.findById(formId);
            };
            return form;
        },

        // 相似费用规则
        _getCostTriggeringRulePanel: function() {
            var panelId = this.getId() + '-CostTriggeringRulePanelId';
            var panel = {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.SubmitFormPanel',
                id: panelId,
                border: false,
                pauseMessage: true,
                api: {
                    load: OfficeRuleController.readCostTriggeringRule,
                    submit: OfficeRuleController.updateCostTriggeringRule
                },
                clientWindowId: this.clientWindowId,
                items: [{
                    xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.GroupPanel',
                    title: '相似费用规则',
                    layout: 'column',
                    items: [{
                            xtype: 'label',
                            width: 280,
                            text: '当收益成本自动匹配，遇到相似费用的情况下，系统 '
                        },
                        this._getAutoTriggerCostRuleCombo()
                    ]
                }]
            };
            this._getCostTriggeringRulePanel = function() {
                return this.findById(panelId);
            };
            return panel;
        },

        _getAutoTriggerCostRuleCombo: function() {
            var comboId = this.getId() + "-" + "autoTriggerCostRuleCombo";
            var store = new Ext.data.ArrayStore({
                fields: ['valueCode', 'displayName'],
                data: [
                    ['SIMILAR_TARIFF_TRIGGER_LOWEST_PRICE', '自动选用最低的单价'],
                    ['SIMILAR_TARIFF_TRIGGER_HIGHEST_PRICE', '自动选用最高的单价'],
                    ['SIMILAR_TARIFF_TRIGGER_LOWEST_TOTAL_PRICE', '自动选用总价最低的'],
                    ['SIMILAR_TARIFF_TRIGGER_HIGHEST_TOTAL_PRICE', '自动选用总价最高的'],
                    ['SIMILAR_TARIFF_TRIGGER_NOT_DO', '不自动生成费用，等待用户手动添加']
                ]
            });
            var combo = {
                xtype: 'combobox',
                id: comboId,
                name: 'autoTriggerCostRule',
                typeAhead: true,
                triggerAction: 'all',
                selectOnFocus: true,
                allowBlank: false,
                modal: 'local',
                width: 220,
                store: store,
                valueField: 'valueCode',
                displayField: 'displayName'
            };
            this._getAutoTriggerCostRuleCombo = function() {
                return this.findById(comboId);
            };
            return combo;
        },

        // 四舍五入规则
        _getRoundRulePanel: function() {
            var id = this.getId() + "-RoundRulePanelId";
            var container = {
                id: id,
                // api: {
                //     load: OfficeRuleController.readTJobCostApprovalRule,
                //     submit: OfficeRuleController.updateTJobCostApprovalRule
                // },
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.GroupPanel',
                title: '四舍五入规则',
                layout: 'column',
                items: [
                    {
                        layout: 'column',
                        items: [
                            this._getRoundingIncomeForm(),
                        ]
                    }, {
                        layout: 'column',
                        items: [
                            this._getRoundingCostForm()
                        ]
                    }
                    
                ]
            };
            this._getRoundRulePanel = function() {
                return this.findById(id);
            };
            return container;
        },

        _getRoundingIncomeForm: function() {
            var id = this.getId() + '-RoundingIncomeForm';
            var form = {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.SubmitFormPanel',
                clientWindowId: this.clientWindowId,
                border: false,
                pauseMessage: true,
                id: id,
                items: [{
                    layout: 'column',
                    items: [
                    {
                        xtype: 'label',
                        html:'<span style="font-weight:bold;">收益：</span>'
                    },
                    this._getRoundingIncomePanel(),
                    ]
                }]
            };
            this._getRoundingIncomeForm = function() {
                return this.findById(id);
            };
            return form;
        },

        
        _getRoundingCostForm: function() {
            var id = this.getId() + '-RoundingCostForm';
            var form = {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.SubmitFormPanel',
                clientWindowId: this.clientWindowId,
                border: false,
                pauseMessage: true,
                id: id,
                items: [
                layout: 'column',
                items: [{

                    
                }
                {
                    xtype: 'label',
                    html: '<span style="font-weight:bold;">成本：</span>'
                },
                this._getRoundingCostPanel()
                ]

                ]
            };
            this._getRoundingCostForm = function() {
                return this.findById(id);
            };
            return form;
        },

        _getRoundingIncomePanel: function () {
            return {
                xtype: 'container',
                items: [
                    {
                        xtype: "container",
                        layout: "table",
                        style: {
                            marginLeft: 10
                        },
                        items: [{
                            xtype: 'label',
                            text: '计费数量'
                        }, {
                            xtype: 'box',
                            width: 83
                        }, {
                            xtype: "checkbox",                            
                            id: 'isRoundingQuantityRuleOn',
                            name: 'isRoundingQuantityRuleOn',
                            handler: function(checkbox) {
                                this._onCheckBoxChanged('income-qty', checkbox.getValue());
                            }
                        },
                            this._getIncomeRoundingQtyCombo(), {
                                xtype: 'box',
                                width: 15
                            },
                            this._getIncomeQtyNumberDigitsCombo()
                        ]
                    }, {
                        xtype: "com.oocl.ir4.sps.framework.web.js.commonUI.Container",
                        layout: "table",
                        style: {
                            marginLeft: 10
                        },
                        items: [{
                            xtype: 'label',
                            text: '收益小计'
                        }, {
                            xtype: 'box',
                            width: 83
                        }, {
                            xtype: 'checkbox',
                            id: 'isRoundingIncomeRuleOn',
                            name: 'isRoundingIncomeRuleOn'
                        },
                            this._getIncomeRoundingSubTotalCombo(), {
                                xtype: 'box',
                                width: 15
                            },
                            this._getIncomeSubTotalNumberDigitsCombo()
                        ]
                    }, {
                        xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.Container',
                        layout: 'table',
                        style: {
                            marginLeft: 10
                        },
                        items: [{
                            xtype: 'label',
                            text: '分摊收益'
                        }, {
                            xtype: 'box',
                            width: 83
                        }, {
                            xtype: 'checkbox',
                            name: 'isRoundingApprotionRuleOn',
                            id: 'isRoundingApprotionRuleOn'
                        },
                            this._getIncomeApportionCostRoundingCombo(), {
                                xtype: 'box',
                                width: 15
                            },
                            this._getIncomeApportionCostRoundingDigitsCombo()

                        ]
                    }
                ]
            };
        },

        _getRoundingCostPanel: function () {
            return {
                xtype: 'container',
                items: [
                    {
                        xtype: "container",
                        layout: "table",
                        style: {
                            marginLeft: 10
                        },
                        items: [{
                            xtype: 'label',
                            text: '计费数量'
                        }, {
                            xtype: 'box',
                            width: 83
                        }, {
                            xtype: "container",
                            layout: "form",
                            items: [this._getRoundingQtyRuleCheckBox()]
                        },
                            this._getRoundingQtyCombo(), {
                                xtype: 'box',
                                width: 15
                            },
                            this._getQtyNumberDigitsCombo()
                        ]
                    }, {
                        xtype: "com.oocl.ir4.sps.framework.web.js.commonUI.Container",
                        layout: "table",
                        style: {
                            marginLeft: 10
                        },
                        items: [{
                            xtype: 'label',
                            text: '成本小计'
                        }, {
                            xtype: 'box',
                            width: 83
                        }, {
                            xtype: "container",
                            layout: "form",
                            items: [this._getRoundingSubTotalRuleCheckBox()]
                        },
                            this._getRoundingSubTotalCombo(), {
                                xtype: 'box',
                                width: 15
                            },
                            this._getSubTotalNumberDigitsCombo()
                        ]
                    }, {
                        xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.Container',
                        layout: 'table',
                        style: {
                            marginLeft: 10
                        },
                        items: [{
                            xtype: 'label',
                            text: '分摊成本'
                        }, {
                            xtype: 'box',
                            width: 83
                        }, {
                            xtype: "container",
                            layout: 'form',
                            items: [this._getApprotionCostRoundingCheckBox()]
                        },
                            this._getApportionCostRoundingCombo(), {
                                xtype: 'box',
                                width: 15
                            },
                            this._getApportionCostRoundingDigitsCombo()

                        ]
                    }
                ]
            }
        },

        _getRoundingQtyRuleCheckBox: function() {
            var checkBoxId = this.getId() + "-roundingQtyCheckBox";
            // var that = this;
            var checkBox = {
                xtype: 'checkbox',
                id: checkBoxId,
                hideLabel: true,
                name: 'isRoundingQtyRuleOn',
                hiddenName: 'isRoundingQtyRuleOn',
                // handler: this._onQtyRoundingRuleChanged,
                handler: function(combo) {
                    this._onCheckBoxChanged('cost-qty', combo.getValue());
                },
                scope: this
            };

            this._getRoundingQtyRuleCheckBox = function() {
                return this.findById(checkBoxId);
            };

            return checkBox;
        },

        _getRoundingSubTotalRuleCheckBox: function() {
            var checkBoxId = this.getId() + "-roundingSubTotalCheckBox";
            var checkBox = {
                xtype: 'checkbox',
                id: checkBoxId,
                hideLabel: true,
                name: 'isRoundingSubTotalRuleOn',
                hiddenName: 'isRoundingSubTotalRuleOn',
                // handler: this._onSubTotalRoundingRuleChanged,
                handler: function(combo) {
                    this._onCheckBoxChanged('cost-subtotal', combo.getValue());
                },
                scope: this
            };

            this._getRoundingSubTotalRuleCheckBox = function() {
                return this.findById(checkBoxId);
            };
            return checkBox;
        },

        _getApprotionCostRoundingCheckBox: function() {
            var checkBoxId = this.getId() + "-approtionCostRoundingCheckBox";
            var checkBox = {
                xtype: 'checkbox',
                id: checkBoxId,
                hideLabel: true,
                name: 'isApportionCostRoundingRuleOn',
                // handler: this._onApprotionCostRoundingChanged,
                handler: function(combo) {
                    this._onCheckBoxChanged('cost-approtion', combo.getValue());
                },
                scope: this
            };
            this._getApprotionCostRoundingCheckBox = function() {
                return this.findById(checkBoxId);
            };
            return checkBox;
        },

        _getRoundingQtyCombo: function() {
            var comboId = this.getId() + "-roundingQtyCombo";
            var config = {
                id: comboId,
                name: "roundingQty",
                hiddenName: "roundingQty",
                fieldLabel: '',
                width: 80,
                disabled: true
            };
            var combo = SupportingDataComponentProvider.createSingleSelcetor(ccConstants.RoundingType,
                config);
            this._getRoundingQtyCombo = function() {
                return this.findById(comboId);
            };

            return combo;
        },

        _getRoundingSubTotalCombo: function() {
            var comboId = this.getId() + "-roundingSubTotalCombo";
            var config = {
                id: comboId,
                fieldLabel: '',
                name: "roundingSubTotal",
                hiddenName: "roundingSubTotal",
                width: 80,
                disabled: true
            };

            var combo = SupportingDataComponentProvider
                .createSingleSelcetor(ccConstants.RoundingType,
                    config);

            this._getRoundingSubTotalCombo = function() {
                return this.findById(comboId);
            };

            return combo;
        },

        _getApportionCostRoundingCombo: function() {
            var comboId = this.getId() + "-apportionCostRoundingCombo";
            var config = {
                id: comboId,
                fieldLabel: '',
                name: 'apportionCostRounding',
                hiddenName: 'apportionCostRounding',
                width: 80,
                disabled: true
            };

            var combo = SupportingDataComponentProvider
                .createSingleSelcetor(ccConstants.RoundingType, config);

            this._getApportionCostRoundingCombo = function() {
                return this.findById(comboId);
            };
            return combo;
        },

        _getIncomeRoundingQtyCombo: function() {
            var comboId = this.getId() + "-IncomeRoundingQtyCombo";
            var config = {
                id: comboId,
                name: "roundingQuantity",
                hiddenName: "roundingQuantity",
                fieldLabel: '',
                width: 80,
                disabled: true
            };
            var combo = SupportingDataComponentProvider.createSingleSelcetor(ccConstants.RoundingType,
                config);
            this._getIncomeRoundingQtyCombo = function() {
                return this.findById(comboId);
            };

            return combo;
        },

        _getIncomeRoundingSubTotalCombo: function() {
            var comboId = this.getId() + "-IncomeRoundingSubTotalCombo";
            var config = {
                id: comboId,
                fieldLabel: '',
                name: "roundingIncome",
                hiddenName: "incomeNumberDigits",
                width: 80,
                disabled: true
            };

            var combo = SupportingDataComponentProvider.createSingleSelcetor(ccConstants.RoundingType,
                    config);

            this._getIncomeRoundingSubTotalCombo = function() {
                return this.findById(comboId);
            };

            return combo;
        },

        _getIncomeApportionCostRoundingCombo: function() {
            var comboId = this.getId() + "-IncomeApportionCostRoundingCombo";
            var config = {
                id: comboId,
                fieldLabel: '',
                name: 'roundingApprotion',
                hiddenName: 'roundingApprotion',
                width: 80,
                disabled: true
            };

            var combo = SupportingDataComponentProvider.createSingleSelcetor(ccConstants.RoundingType, config);

            this._getIncomeApportionCostRoundingCombo = function() {
                return this.findById(comboId);
            };
            return combo;
        },

        _buildDigitStore: function() {
            var digits = [
                ['-3', '千分位'],
                ['-2', '百分位'],
                ['-1', '十分位'],
                ['0', '个位'],
                ['1', '十位'],
                ['2', '百位'],
                ['3', '千位']
            ];
            return new Ext.data.ArrayStore({
                id: 0,
                fields: ["id", "fullName"],
                data: digits
            });
        },

        _getQtyNumberDigitsCombo: function() {
            var comboId = this.getId() + "-qtyNumberDigitsCombo";
            var digitsStore = this._buildDigitStore();
            var combo = {
                id: comboId,
                xtype: "combo",
                store: digitsStore,
                valueField: "id",
                displayField: "fullName",
                typeAhead: true,
                triggerAction: 'all',
                lazyRender: true,
                mode: 'local',
                name: "qtyNumberDigits",
                hiddenName: "qtyNumberDigits",
                width: 50,
                disabled: true
            };
            this._getQtyNumberDigitsCombo = function() {
                return this.findById(comboId);
            };
            return combo;
        },

        _getSubTotalNumberDigitsCombo: function() {
            var comboId = this.getId() + "-SubTotalNumberDigitsComboId";
            var digitsStore = this._buildDigitStore();
            var combo = {
                id: comboId,
                xtype: "combo",
                store: digitsStore,
                valueField: "id",
                displayField: "fullName",
                typeAhead: true,
                triggerAction: 'all',
                lazyRender: true,
                mode: 'local',
                name: "subTotalNumberDigits",
                hiddenName: "subTotalNumberDigits",
                width: 50,
                disabled: true
            };
            this._getSubTotalNumberDigitsCombo = function() {
                return this.findById(comboId);
            };
            return combo;
        },

        _getApportionCostRoundingDigitsCombo: function() {
            var comboId = this.getId() + "-apportionCostRoundingDigitsCombo";
            var digitsStore = this._buildDigitStore();
            var combo = {
                id: comboId,
                xtype: "combo",
                store: digitsStore,
                valueField: "id",
                displayField: "fullName",
                typeAhead: true,
                triggerAction: 'all',
                lazyRender: true,
                mode: 'local',
                name: "apportionCostNumberDigits",
                hiddenName: "apportionCostNumberDigits",
                width: 50,
                disabled: true
            };
            this._getApportionCostRoundingDigitsCombo = function() {
                return this.findById(comboId);
            };
            return combo;
        },

        _getIncomeQtyNumberDigitsCombo: function() {
            var comboId = this.getId() + "-qtyNumberDigitsCombo";
            var digitsStore = this._buildDigitStore();
            var combo = {
                id: comboId,
                xtype: "combo",
                store: digitsStore,
                valueField: "id",
                displayField: "fullName",
                typeAhead: true,
                triggerAction: 'all',
                lazyRender: true,
                mode: 'local',
                name: "qtyNumberDigits",
                hiddenName: "qtyNumberDigits",
                width: 50,
                disabled: true
            };
            this._getIncomeQtyNumberDigitsCombo = function() {
                return this.findById(comboId);
            };
            return combo;
        },

        _getIncomeSubTotalNumberDigitsCombo: function() {
            var comboId = this.getId() + "-IncomeSubTotalNumberDigitsComboId";
            var digitsStore = this._buildDigitStore();
            var combo = {
                id: comboId,
                xtype: "combo",
                store: digitsStore,
                valueField: "id",
                displayField: "fullName",
                typeAhead: true,
                triggerAction: 'all',
                lazyRender: true,
                mode: 'local',
                name: "subTotalNumberDigits",
                hiddenName: "subTotalNumberDigits",
                width: 50,
                disabled: true
            };
            this._getIncomeSubTotalNumberDigitsCombo = function() {
                return this.findById(comboId);
            };
            return combo;
        },

        _getIncomeApportionCostRoundingDigitsCombo: function() {
            var comboId = this.getId() + "-IncomeApportionCostRoundingDigitsCombo";
            var digitsStore = this._buildDigitStore();
            var combo = {
                id: comboId,
                xtype: "combo",
                store: digitsStore,
                valueField: "id",
                displayField: "fullName",
                typeAhead: true,
                triggerAction: 'all',
                lazyRender: true,
                mode: 'local',
                name: "apportionCostNumberDigits",
                hiddenName: "apportionCostNumberDigits",
                width: 50,
                disabled: true
            };
            this._getIncomeApportionCostRoundingDigitsCombo = function() {
                return this.findById(comboId);
            };
            return combo;
        },

        _onCheckBoxChanged: function(type, bChecked) {
            var comboArr = this._getCombos(type);
            Ext.each(comboArr, function(combo) {
                combo.setIsMandatory(bChecked);
                combo.setDisabled(!bChecked);
            });
        },

        _getCombos: function(type) {
            var result = [];
            switch(type) {
                //收益
                // 计费数量
                case 'income-qty':
                break;
                // 收益小计
                case 'income-subtotal':
                break;
                // 分摊收益
                case 'income-approtion':
                break;
                // 成本
                // 计费数量
                case 'cost-qty':
                    result.push(this._getRoundingQtyCombo());
                    result.push(this._getQtyNumberDigitsCombo());
                break;
                // 成本小计
                case 'cost-subtotal':
                    result.push(this._getRoundingSubTotalCombo());
                    result.push(this._getSubTotalNumberDigitsCombo());
                break;
                // 分摊成本
                case 'cost-approtion':
                    result.push(this._getApportionCostRoundingCombo());
                    result.push(this._getApportionCostRoundingDigitsCombo());
                break;
            }
            return result;
        },

        _onIsRequireApprovalProcessForAP: function(checkBox, checked) {
            if (!checked) {
                this._getRequireApprovalStepsCombo().setValue('5509');
            } else {
                this._getRequireApprovalStepsCombo().setValue('5510');
            }
        },

        _onIsNeedInvoiceReqIsssueForAr: function(checkbox, checked) {
            this._getRequireApprovalStepsCombo().setDisabled(!checked);
            Ext.getCmp('isRequireApprovalProcessForAP').setDisabled(!checked);
        },

        _getRequireApprovalStepsCombo: function() {
            var id = this.getId() + "-" + "RequireApprovalStepsCombo";
            var combo = {
                xtype: 'combobox',
                id: id,
                typeAhead: true,
                triggerAction: 'all',
                mode: 'local',
                store: new Ext.data.ArrayStore({
                    fields: ['display', 'apBillingStatus'],
                    data: [
                        ['', 5509],
                        ['0', 5510],
                        ['1', 5511],
                        ['2', 5512],
                        ['3', 5514]
                    ]
                }),
                width: 50,
                scope: this,
                valueField: 'apBillingStatus',
                displayField: 'display',
                name: 'maxApBillingReportStatus',
                hiddenName: 'maxApBillingReportStatus'
            };

            this._getRequireApprovalStepsCombo = function() {
                return this.findById(id);
            };

            return combo;
        },

        // 费用审批规则
        _getArApApprovalProcessRulePanel: function() {
            var panelId = this.getId() + '-ArApApprovalProcessRulePanelId';
            var panel = {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.SubmitFormPanel',
                id: panelId,
                border: false,
                pauseMessage: true,
                api: {
                    load: OfficeRuleController.readArApApprovalProcessRule,
                    submit: OfficeRuleController.updateArApApprovalProcessRule
                },
                clientWindowId: this.clientWindowId,
                items: [{
                    xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.GroupPanel',
                    title: '费用审批规则',
                    layout: 'table',
                    items: [{
                        xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.Container',
                        layout: 'table',
                        items: [{
                            xtype: 'checkbox',
                            boxLabel: '应收账款需要提请审批流程',
                            anchor: '100%',
                            hideLabel: true,
                            name: 'isNeedInvoiceReqIssueForAr',
                            hiddenName: 'isNeedInvoiceReqIssueForAr',
                            handler: Ext.createDelegate(this._onIsNeedInvoiceReqIsssueForAr, this)
                        }]
                    }, {
                        xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.Container',
                        layout: 'table',
                        items: [{
                                xtype: 'checkbox',
                                boxLabel: '应付账款需要提请审批流程，',
                                hideLabel: true,
                                id: 'isRequireApprovalProcessForAP',
                                scope: this,
                                handler: this._onIsRequireApprovalProcessForAP
                            }, {
                                id: 'labelBeforeApprovalStepsCombo',
                                xtype: 'label',
                                text: '最多 '
                            },
                            this._getRequireApprovalStepsCombo(), {
                                id: 'labelAfterApprovalStepsCombo',
                                xtype: 'label',
                                text: ' 级审批'
                            }
                        ]
                    }]
                }]
            };
            this._getArApApprovalProcessRulePanel = function() {
                return this.findById(panelId);
            };
            return panel;
        },

        _onQtyRoundingRuleChanged: function(oCheckBox, bChecked) {
            this._getRoundingQtyCombo().setIsMandatory(bChecked);
            this._getRoundingQtyCombo().setDisabled(!bChecked);
            this._getQtyNumberDigitsCombo().setIsMandatory(bChecked);
            this._getQtyNumberDigitsCombo().setDisabled(!bChecked);
        },

        _onSubTotalRoundingRuleChanged: function(oCheckBox, bChecked) {
            this._getRoundingSubTotalCombo().setIsMandatory(bChecked);
            this._getRoundingSubTotalCombo().setDisabled(!bChecked);
            this._getSubTotalNumberDigitsCombo().setIsMandatory(bChecked);
            this._getSubTotalNumberDigitsCombo().setDisabled(!bChecked);
        },

        _onApprotionCostRoundingChanged: function(oCheckBox, bChecked) {
            this._getApportionCostRoundingCombo().setIsMandatory(bChecked);
            this._getApportionCostRoundingCombo().setDisabled(!bChecked);
            this._getApportionCostRoundingDigitsCombo().setIsMandatory(bChecked);
            this._getApportionCostRoundingDigitsCombo().setDisabled(!bChecked);
        },

        // 增值税规则
        _getVatRulePanel: function() {
            var panelId = this.getId() + 'VatRulePanelId';
            var panel = {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.SubmitFormPanel',
                id: panelId,
                border: false,
                pauseMessage: true,
                api: {
                    load: OfficeRuleController.readVatRule,
                    submit: OfficeRuleController.updateVatRule
                },
                clientWindowId: this.clientWindowId,
                items: [{
                    xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.GroupPanel',
                    title: '增值税规则',
                    items: [{
                        xtype: 'container',
                        layout: 'table',
                        items: [{
                                xtype: 'checkbox',
                                name: 'vatRateApplicable',
                                boxLabel: '应用增值税',
                                hiddenName: 'vatRateApplicable',
                                handler: this._onVatRateApplicableChanged,
                                scope: this
                            }, {
                                xtype: 'label',
                                style: 'margin-right:10px;margin-left:20px;',
                                text: '增值税率'
                            },
                            this._getVatRateCombo(), {
                                xtype: 'label',
                                text: '合同运价是：'
                            },
                            this._getIsIncludeVatCombo()
                        ]
                    }]
                }]
            };

            this._getVatRulePanel = function() {
                return this.findById(panelId);
            };
            return panel;
        },

        //增值税率
        _getVatRateCombo: function() {
            var comboId = this.getId + "-" + "vateRateCombo";

            this._getVatRateCombo = function() {
                return this.findById(comboId);
            };
            return SupportingDataComponentProvider.createSingleSelcetor(ccConstants.VatRate, {
                name: 'vatRateValue',
                fieldLabel: '',
                id: comboId,
                disabled: false,
                hiddenName: 'vatRateValue',
                width: 50
            });
        },

        //是否含税价
        _getIsIncludeVatCombo: function() {
            var comboId = this.getId() + "-" + "isIncludeVatCombo";
            var combo = [{
                xtype: 'combobox',
                id: comboId,
                mode: 'local',
                triggerAction: 'all',
                disabled: false,
                store: com.oocl.ir4.sps.web.js.profile.office.stores.VatInclusiveStore,
                valueField: 'code',
                displayField: 'displayText',
                width: 80,
                fieldLabel: '',
                hideLabel: false,
                name: 'isInclusive',
                hiddenName: 'isInclusive',
                style: 'margin-left:5px'
            }];
            this._getIsIncludeVatCombo = function() {
                return this.findById(comboId);
            };
            return combo;
        },

        _onVatRateApplicableChanged: function(checkBox, checked) {
            var columnMode = this._getAssociatedChargeItemGrid().getColumnModel();
            columnMode.getColumnById('isVatApplicable').editable = checked;

            if (!checked) {
                var store = this._getAssociatedChargeItemGrid().getStore();

                store.each(function(record) {
                    record.set('isVatApplicable', false);
                });

                this._getVatRateCombo().disable();
                this._getIsIncludeVatCombo().disable();
            }
            if (checked) {
                this._getVatRateCombo().enable();
                this._getIsIncludeVatCombo().enable();
            }
        },

        // 保险费
        _getInsuranceFeePanel: function() {
            var id = this.getId() + '-InsuranceFeePanelId';
            var panel = {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.SubmitFormPanel',
                pauseMessage: true,
                clientWindowId: this.clientWindowId,
                id: id,
                border: false,
                items: [{
                        xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.GroupPanel',
                        title: '保险费',
                        layout: 'table',
                        items: [
                            this._getIsInsuranceFeeCheckBox(), {
                                xtype: 'label',
                                text: '货物申明价值的',
                                width: 300
                            },
                            this._getInsuranceFeeFeild(), {
                                xtype: 'label',
                                text: '‰'
                            }
                        ]
                    }

                ]
            };
            this._getInsuranceFeePanel = function() {
                return this.findById(id);
            };
            return panel;
        },

        _getIsInsuranceFeeCheckBox: function() {
            var id = this.getId() + '-IsInsuranceFeeCheckId';
            var checkbox = {
                xtype: 'checkbox',
                name: 'isInsuranceFeeRateApplicable',
                boxLabel: '保险费',
                width: 100,
                handler: this._onIsInsuranceFeeChanged,
                scope: this,
            };
            this._getIsInsuranceFeeCheckBox = function() {
                return this.findById(id);
            };
            return checkbox;
        },

        _getInsuranceFeeFeild: function() {
            var id = this.getId() + '-InsuranceFeeFieldId';
            var numberfield = {
                name: 'insuranceFeeRate',
                id: id,
                xtype: 'numberfield',
                disabled: false,
                allowDecimals: false,
                value: 3,
                maxValue: 1000,
                width: 50
            };
            this._getInsuranceFeeFeild = function() {
                return this.findById(id);
            };
            return numberfield;
        },

        _onIsInsuranceFeeChanged: function(checkbox, checked) {
            if (checked) {
                this._getInsuranceFeeFeild().enable();
                this._getInsuranceFeeFeild().setValue(3);
            } else {
                this._getInsuranceFeeFeild().disable();
            }
        },

        _getIsCodFeeCheckBox: function() {
            var id = this.getId() + '-IsCodFeeCheckId';
            var checkbox = {
                xtype: 'checkbox',
                columnWidth: 1,
                id: id,
                name: 'isCollectionOfGoodsPayment',
                boxLabel: '代收货款手续费定义',
                handler: this._onIsCodFeeChanged,
                scope: this
            };
            this._getIsCodFeeCheckBox = function() {
                return this.findById(id);
            };
            return checkbox;
        },
        _getCollectionOfGoodsPaymentRulePanel: function() {
            var id = this.getId() + '-CollectionOfGoodsPaymentRulePanelId';
            var panel = {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.SubmitFormPanel',
                pauseMessage: true,
                clientWindowId: this.clientWindowId,
                id: id,
                border: false,
                layout: 'column',
                items: [this._getIsCodFeeCheckBox(), this._getCodFeePanel()],
                validate: Ext.createDelegate(function() {
                    if (!this._getIsCodFeeCheckBox().getValue()) {
                        return true;
                    }
                    if (this._getCodRadioGroup().getValue() == 'rate') {
                        if (Ext.isEmpty(this._getChargeRateFeild().getValue())) {
                            this._getChargeRateFeild().markInvalid(errorMessages.CMM059E());
                            return false;
                        } else {
                            return true;
                        }
                    } else if (this._getCodRadioGroup().getValue() == 'grade') {
                        return this._getCodRatioSettingGrid().validate();
                    }
                    return true;
                }, this)
            };
            this._getCollectionOfGoodsPaymentRulePanel = function() {
                return this.findById(id);
            };
            return panel;
        },
        _getCodFeePanel: function() {
            var id = this.getId() + '-CodFeePanelId';
            var panel = {
                xtype: 'container',
                id: id,
                columnWidth: 1,
                clientWindowId: this.clientWindowId,
                border: false,
                pauseMessage: true,
                hidden: true,
                style: {
                    marginLeft: 15
                },
                items: [{
                    border: false,
                    items: [this._getCodRadioGroup()]
                }]
            };
            this._getCodFeePanel = function() {
                return this.findById(id);
            };
            return panel;
        },
        _getCodRadioGroup: function() {
            var id = this.getId() + '-CodRadioGroupId';
            var radioGroup = {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.RadioGroup',
                name: 'collectType',
                isMandatory: true,
                id: id,
                allowBlank: false,
                layout: 'column',
                items: [{
                    columnWidth: 1,
                    layout: 'column',
                    items: [{
                        xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.Radio',
                        boxLabel: '按货款额度的',
                        inputValue: 'rate',
                        name: 'type',
                        checked: true
                    }, this._getChargeRateFeild(), {
                        xtype: 'label',
                        text: '‰收取'
                    }]
                }, {
                    columnWidth: 1,
                    layout: 'column',
                    items: [{
                        xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.Radio',
                        boxLabel: '按货款额度级别收取',
                        inputValue: 'grade',
                        name: 'type'
                    }, {
                        xtype: 'spacer',
                        height: 5
                    }, this._getCodRatioSettingGrid()]
                }]
            };
            this._getCodRadioGroup = function() {
                return Ext.getCmp(id);
            };
            return radioGroup;
        },

        _getChargeRateFeild: function() {
            var id = this.getId() + '-ChargeRateFieldId';
            var numberfield = {
                name: 'chargeRate',
                id: id,
                xtype: 'numberfield',
                allowDecimals: false,
                maxValue: 1000,
                width: 50
            };
            this._getChargeRateFeild = function() {
                return Ext.getCmp(id);
            };
            return numberfield;
        },

        _onIsCodFeeChanged: function(checkbox, checked) {
            if (checked) {
                this._getCodFeePanel().show();
            } else {
                this._getCodFeePanel().hide();
            }
        },

        _getCodRatioSettingGrid: function() {
            var gridId = this.getId() + '-CodRatioSettingGrid';
            var store = new com.oocl.ir4.sps.framework.web.js.commonUI.data.Store({
                reader: new com.oocl.ir4.sps.framework.web.js.commonUI.data.JsonReader({
                    fields: ['clientKey', {
                        name: 'tierFrom',
                        sortType: function(v) {
                            return (H.isEmpty(v)) ? Number.POSITIVE_INFINITY : Number(v);
                        }
                    }, 'tierTo', 'chargeAmount', 'oid']
                }),
                writer: new com.oocl.ir4.sps.framework.web.js.commonUI.data.JsonWriter(),
                sortInfo: {
                    field: 'tierFrom',
                    direction: 'ASC'
                },
                autoSave: false
            });
            var sm = new Ext.grid.CheckboxSelectionModel();
            var grid = {
                xtype: 'editorgrid',
                id: gridId,
                store: store,
                width: 400,
                height: 160,
                editable: true,
                tbar: {
                    xtype: 'toolbar',
                    hidden: !this.helper.isAccessibleWithOffice(this.constants.FeatureNames.New_OfficeRule_Setting_Maintenance, this.constants.Permissions.ENABLE, this.officeId),
                    items: [{
                        xtype: 'addbutton',
                        ref: 'addBtn',
                        scope: this,
                        handler: function() {
                            var grid = this._getCodRatioSettingGrid();
                            var newRecord = grid.getNewRecord();
                            grid.store.add(newRecord);
                        }
                    }, {
                        xtype: 'removebutton',
                        ref: 'removeBtn',
                        scope: this,
                        handler: function() {
                            var grid = this._getCodRatioSettingGrid();
                            var selectedRecs = grid.getSelectionModel().getSelections();
                            if (0 === selectedRecs.length) {
                                H.messageByCode('CMM049W');
                                return;
                            }
                            grid.stopEditing();
                            selectedRecs.sort(function(a, b) {
                                return grid.store.indexOf(a) - grid.store.indexOf(b);
                            });
                            H.each(selectedRecs, function(rec) {
                                var index = grid.store.indexOf(rec);
                                var nextRec = grid.store.getAt(index + 1);
                                if (!H.isEmpty(nextRec)) {
                                    nextRec.set('from', rec.get('from'));
                                }
                            }, this);
                            grid.store.remove(selectedRecs);
                        }
                    }]
                },
                selModel: sm,
                columns: [sm, {
                    header: '货款下限 (>=)',
                    dataIndex: 'tierFrom',
                    id: 'tierFrom',
                    width: 100,
                    sortable: false
                }, {
                    header: '货款上限 (<)',
                    dataIndex: 'tierTo',
                    id: 'tierTo',
                    width: 100,
                    sortable: false,
                    editor: {
                        xtype: 'textfield',
                        vtype: 'integer9'
                    }
                }, {
                    header: '手续费',
                    dataIndex: 'chargeAmount',
                    id: 'chargeAmount',
                    sortable: false,
                    width: 100,
                    editor: {
                        xtype: 'textfield',
                        vtype: 'decimal9_2_positive'
                    }
                }],
                listeners: {
                    afteredit: function(o) {
                        var index = grid.store.indexOf(o.record);
                        var nextRec = grid.store.getAt(index + 1);
                        if (!H.isEmpty(nextRec)) {
                            nextRec.set('tierFrom', o.record.get('tierTo'));
                        }
                    }
                },
                getNewRecord: function() {
                    var lastRec = this.store.getRange().pop();
                    var from = '0';
                    if (!H.isEmpty(lastRec)) {
                        if (!H.isEmpty(lastRec.get('tierTo'))) {
                            from = lastRec.get('tierTo');
                        }
                    }
                    var newItem = {
                        clientKey: new com.oocl.ir4.sps.framework.web.js.common.util.UUID().id,
                        tierFrom: from
                    };
                    var newRecord = new this.store.recordType(newItem, newItem.clientKey);
                    newRecord.phantom = true;
                    return newRecord;
                },
                validate: function() {
                    var records = this.store.getRange();
                    var errors = {};
                    var isValid = true;
                    H.each(records, function(rec) {
                        errors[rec.id] = {};
                        if (H.isEmpty(rec.get('chargeAmount'))) {
                            isValid = false;
                            errors[rec.id]['chargeAmount'] = '手续费是必填的';
                        }
                    }, this);
                    com.oocl.ir4.sps.framework.web.js.commonUI.data.ServerValidationProcessor.processGrid(this, errors);
                    return isValid;
                }
            };
            this._getCodRatioSettingGrid = function() {
                return Ext.getCmp(gridId);
            };
            return grid;
        },



        // 关联费用规则
        _getChargeItemPanel: function() {
            var id = this.getId() + "-" + "ChargeItemPanel";
            var panel = {
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.form.SubmitFormPanel',
                id: id,
                border: false,
                pauseMessage: true,
                api: {
                    load: OfficeRuleController.fakeRead,
                    submit: OfficeRuleController.fakeUpdate
                },
                clientWindowId: this.clientWindowId,
                items: [{
                    xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.GroupPanel',
                    title: '关联费用项目',
                    layout: 'fit',
                    autoHeight: true,
                    items: [{
                            xtype: 'hidden',
                            name: 'oid'
                        },
                        this._getAssociatedChargeItemGrid(), {
                            xtype: 'spacer',
                            height: 3
                        },
                        this._getNtChargeItemLabel()
                    ]
                }]
            };

            this._getChargeItemPanel = function() {
                return this.findById(id);
            };

            return panel;
        },

        _getNtChargeItemLabel: function() {

            var id = this.getId() + "-" + "NtChargeItemLabel";
            var label = {
                xtype: 'label',
                id: id,
                html: '<span"><img src="' + GlobalConfiguration.appPath + '/images/sps/information.png" width="16" height="16" align="top"/>' + '<font color="blue">代垫费用，勾选上的费用条目将作为单独代垫费用来结算，区别于月结等结算方式；特殊作业，勾选上的费用项目将作为特殊作业在运单上供调度作司机操作安排；</font>'
            };

            this._getNtChargeItemLabel = function() {
                return this.findById(id);
            };

            return label;
        },

        _getAssociatedChargeItemGrid: function() {
            var gridId = this.getId() + "-" + "AssociatedChargeItemGrid";
            var store = {
                xtype: "com.oocl.ir4.sps.framework.web.js.commonUI.data.Store",
                proxy: new com.oocl.ir4.sps.framework.web.js.commonUI.data.DirectProxy({
                    api: {
                        read: OfficeRuleController.readAssociatedChargeItems,
                        create: OfficeRuleController.createAssociatedChargeItems,
                        destroy: OfficeRuleController.deleteAssociatedChargeItems
                    },
                    clientWindowId: this.clientWindowId
                }),
                reader: new com.oocl.ir4.sps.framework.web.js.commonUI.data.JsonReader({
                    idProperty: 'oid',
                    fields: ['oid', 'serviceName', 'activityName',
                        'englishName', 'simpleChineseName',
                        'chargeGroupCode', 'chargeTypeName',
                        'isActive', 'isSpecialAction', "isDollarInOut", "isVatApplicable", "isAutoShowInOrder", "sequence"
                    ]
                }),
                writer: new com.oocl.ir4.sps.framework.web.js.commonUI.data.JsonWriter(),
                autoSave: false,
                listeners: {
                    load: Ext.createDelegate(function() {
                        this._getAddChargeItemBtn().setDisabled(false);
                        this._getRemoveChargeItemBtn()
                            .setDisabled(false);
                    }, this)
                }
            };

            var sm = new Ext.grid.CheckboxSelectionModel();
            var grid = {
                id: gridId,
                xtype: 'com.oocl.ir4.sps.framework.web.js.commonUI.grid.EditorGridPanel',
                store: store,
                clicksToEdit: 1,
                loadMask: true,
                autoWidth: true,
                height: 280,
                selModel: sm,
                columns: [sm, {
                    header: 'Charge Item Name (English)',
                    hidden: true,
                    dataIndex: 'englishName',
                    id: 'englishName',
                    editable: false,
                    width: 165
                }, {
                    header: '费用名称',
                    dataIndex: 'simpleChineseName',
                    id: 'simpleChineseName',
                    editable: false,
                    width: 165
                }, {
                    header: 'Charge Group',
                    hidden: true,
                    dataIndex: 'chargeGroupCode',
                    id: 'chargeGroupCode',
                    editable: false,
                    width: 165
                }, {
                    header: '费用类型',
                    dataIndex: 'chargeTypeName',
                    id: 'chargeTypeName',
                    editable: false,
                    width: 80
                }, {
                    header: '服务类型',
                    dataIndex: 'serviceName',
                    id: 'serviceName',
                    editable: false,
                    width: 165
                }, {
                    header: 'Activity',
                    hidden: true,
                    dataIndex: 'activityName',
                    id: 'activityName',
                    editable: false,
                }, {
                    header: 'Active',
                    hidden: true,
                    dataIndex: 'isActive',
                    id: 'isActive',
                    editable: false,
                    width: 165
                }, {
                    header: "是否为代垫费用",
                    dataIndex: "isDollarInOut",
                    id: "isDollarInOut",
                    xtype: "checkcolumn",
                    width: 165
                }, {
                    header: "是否应用增值税",
                    dataIndex: "isVatApplicable",
                    id: "isVatApplicable",
                    xtype: "checkcolumn",
                    width: 165
                }, {
                    header: '是否需要特殊作业',
                    width: 165,
                    dataIndex: 'isSpecialAction',
                    id: 'isSpecialAction',
                    xtype: 'checkcolumn',
                }, {
                    header: '订单页面默认显示',
                    width: 165,
                    dataIndex: 'isAutoShowInOrder',
                    id: 'isAutoShowInOrder',
                    xtype: 'checkcolumn',
                }, {
                    header: '顺序',
                    dataIndex: 'sequence',
                    id: 'sequence',
                }],
                tbar: [this._getAddChargeItemBtn(), {
                    xtype: 'tbseparator',
                    hidden: !this.helper
                        .isAccessibleWithOffice(
                            this.constants.FeatureNames.New_OfficeRule_Setting_Maintenance,
                            this.constants.Permissions.ENABLE,
                            this.officeId)
                }, this._getRemoveChargeItemBtn(), this._getMoveUpBtn(), this._getMoveDownBtn()]

            };
            this._getAssociatedChargeItemGrid = function() {
                return this.findById(gridId);
            };
            return grid;
        },

        _getAddChargeItemBtn: function() {
            var btnId = this.getId() + "-" + "AddChargeItem";
            var btn = {
                id: btnId,
                text: '添加',
                //disabled: true,
                iconCls: 'btn-icon-add',
                hidden: !this.helper
                    .isAccessibleWithOffice(
                        this.constants.FeatureNames.New_OfficeRule_Setting_Maintenance,
                        this.constants.Permissions.ENABLE,
                        this.officeId),
                tooltip: '添加费用项目',
                align: 'center',
                xtype: 'button',
                handler: Ext.createDelegate(this._onAddChargeItem, this)
            };
            this._getAddChargeItemBtn = function() {
                return Ext.getCmp(btnId);
            };

            return btn;
        },

        _getRemoveChargeItemBtn: function() {
            var btnId = this.getId() + "-" + "RemoveChargeItem";

            var btn = {
                id: btnId,
                text: '删除',
                //disabled: true,
                hidden: !this.helper
                    .isAccessibleWithOffice(
                        this.constants.FeatureNames.New_OfficeRule_Setting_Maintenance,
                        this.constants.Permissions.ENABLE,
                        this.officeId),
                iconCls: 'btn-icon-delete',
                tooltip: '删除费用项目',
                align: 'center',
                xtype: 'button',
                handler: Ext
                    .createDelegate(this._onRemoveChargeItem, this)
            };
            this._getRemoveChargeItemBtn = function() {
                return Ext.getCmp(btnId);
            };

            return btn;
        },

        _getMoveUpBtn: function() {
            var btnId = this.getId() + 'MoveUpBtn';
            var btn = {
                id: btnId,
                text: '上移',
                align: 'center',
                xtype: 'button',
                handler: Ext.createDelegate(this.executeMove, this, [true])
            };
            this._getMoveUpBtn = function() {
                return Ext.getCmp(btnId);
            };
            return btn;
        },

        _getMoveDownBtn: function() {
            var btnId = this.getId() + 'MoveDownBtn';
            var btn = {
                id: btnId,
                text: '下移',
                align: 'center',
                xtype: 'button',
                handler: Ext.createDelegate(this.executeMove, this, [false])
            };
            this._getMoveDownBtn = function() {
                return Ext.getCmp(btnId);
            };
            return btn;
        },
        
        executeMove: function(isMoveUp) {
            var grid = this._getAssociatedChargeItemGrid();
            var store = grid.store;
            var length = store.getCount();
            var selections = grid.getSelectionModel().getSelections();
            var record = selections[0];
            if (selections.length > 1) {
                H.message('只能选择一条记录！');
                return;
            }
            if (!record) {
                return;
            }
            var index = store.getRange().indexOf(record);
            var currentSequence = record.data.sequence;
            if (isMoveUp) {
                index --;
                if (index < 0) {
                    return;
                }
                record.data.sequence = currentSequence - 1;
                this.modifyRec(grid, index, 'sequence', currentSequence);
            } else {
                index ++;
                if (index >= length) {
                    return;
                }
                record.data.sequence = currentSequence + 1;
                this.modifyRec(grid, index, 'sequence', currentSequence);
            }
            grid.getStore().remove(record);
            grid.getStore().insert(index, record);
            grid.getSelectionModel().selectRow(index, true);
        },

        modifyRec: function(grid, index, property, newVal) {
            grid.getStore().getAt(index).set(property, newVal);
            grid.getStore().getAt(index).commit();
        },

        _onAddChargeItem: function() {
            require('vtm/chargeitem/SearchChargeItemView', function() {
                var window = new com.oocl.ir4.sps.web.js.vtm.chargeitem.SearchChargeItemView({
                    isT: 'true',
                    isSurcharge: 'true',
                    showAll: 'true',
                });

                var store = this._getAssociatedChargeItemGrid().getStore();

                var defaultChargeItemOids = [];
                store.each(function(record) {
                    defaultChargeItemOids.push(record.get('oid'));
                });

                window.setDefaults(defaultChargeItemOids);

                window.on('beforeclose', function(window) {
                    var selections = window.getValue();
                    if (null == selections) {
                        return;
                    }
                    H.each(selections, function(record) {
                        if (record != null && store.findExact('oid', record.oid) == -1) {
                            var newRecord = new store.recordType(record,
                                record.oid);
                            newRecord.phantom = true;
                            store.insert(0, newRecord);
                        }
                    });
                }, this);
                window.show();
            }.createDelegate(this));
        },

        _onRemoveChargeItem: function() {
            var grid = this._getAssociatedChargeItemGrid();
            var selectionModel = grid.getSelectionModel();
            var store = this._getAssociatedChargeItemGrid().getStore();

            if (selectionModel.hasSelection()) {
                Ext.Msg.confirm('Confirm', errorMessages.PRF003W(),
                    function(btn) {
                        if (btn === 'yes') {
                            var selectedRecords = selectionModel
                                .getSelections();
                            store.remove(selectedRecords);
                        }
                    }.createDelegate(this));
            } else {
                H.messageByCode('CMM049W');
            }
        }
    });

H.reg("com.oocl.ir4.sps.web.js.profile.office.BasicCostManagerialRules",
    com.oocl.ir4.sps.web.js.profile.office.BasicCostManagerialRules);