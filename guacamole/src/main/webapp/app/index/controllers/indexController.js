/*
 * Copyright (C) 2014 Glyptodon LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * The controller for the root of the application.
 */
angular.module('index').controller('indexController', ['$scope', '$injector',
        function indexController($scope, $injector) {
            
    // Get the dependencies commonJS style
    var permissionDAO           = $injector.get("permissionDAO"),
        permissionCheckService  = $injector.get("permissionCheckService"),
        authenticationService   = $injector.get("authenticationService"),
        $q                      = $injector.get("$q"),
        $document               = $injector.get("$document"),
        $window                 = $injector.get("$window"),
        $location               = $injector.get("$location");
    
    /*
     * Safe $apply implementation from Alex Vanston:
     * https://coderwall.com/p/ngisma
     */
    $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase === '$apply' || phase === '$digest') {
            if(fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    // Put some useful variables in the top level scope
    $scope.page = {
        title: '',
        bodyClassName: ''
    };
    $scope.currentUserID = null;
    $scope.currentUserIsAdmin = false;
    $scope.currentUserHasUpdate = false;
    $scope.currentUserPermissions = null;
    $scope.notifications = [];
    var notificationUniqueID = 0;
    
    // A promise to be fulfilled when all basic user permissions are loaded.
    var permissionsLoaded= $q.defer();
    $scope.basicPermissionsLoaded = permissionsLoaded.promise;
    
    $scope.currentUserID = authenticationService.getCurrentUserID();
    
    // If the user is unknown, force a login
    if(!$scope.currentUserID)
        $location.path('/login');

    /**
     * Shows or hides the given notification as a modal status. If a status
     * notification is currently shown, no further statuses will be shown
     * until the current status is hidden.
     *
     * @param {Object} status The status notification to show.
     * @param {String} [status.title] The title of the notification.
     * @param {String} [status.text] The body text of the notification.
     * @param {String} [status.className] The CSS class name to apply.
     *
     * @param {String} [status.countdown.text]
     *     In the case that a countdown applies to the notification, the text to
     *     display while the countdown is active.
     *
     * @param {Function} [status.countdown.callback]
     *     The callback to call when the countdown expires.
     *
     * @param {String} [status.countdown.remaining]
     *     The number of seconds remaining before the countdown callback is
     *     called.
     *
     * @param {String} [status.progress.text]
     *     If this notification has associated progress, the text to display
     *     while the operation is occurring.
     *
     * @param {String} [status.progress.value]
     *     The current state of operation progress, as an arbitrary number
     *     which increases as the operation continues.
     *
     * @param {String} [status.progress.unit]
     *     The unit of the arbitrary status.progress.value, if that value has
     *     an associated unit.
     *
     * @param {String} [status.progress.ratio]
     *     If known, the current status of the operation as a value between
     *     0 and 1 inclusive, where 0 is not yet started, and 1 is complete.
     *
     * @param {Object[]} [status.actions]
     *     Array of action objects which contain an action name and callback to
     *     be executed when that action is invoked. 
     *
     * @example
     * 
     * // To show a status message with actions
     * $scope.showStatus({
     *     'title'      : 'Disconnected',
     *     'text'       : 'You have been disconnected!',
     *     'actions'    : {
     *         'name'       : 'reconnect',
     *         'callback'   : function () {
     *             // Reconnection code goes here
     *         }
     *     }
     * });
     * 
     * // To hide the status message
     * $scope.showStatus(false);
     */
    $scope.showStatus = function showStatus(status) {
        if (!$scope.status || !status)
            $scope.status = status;
    };
    
    /**
     * Adds a notification to the the list of notifications shown.
     * 
     * @param {Object} notification The notification to add.
     * @param {String} [notification.title] The title of the notification.
     * @param {String} [notification.text] The body text of the notification.
     * @param {String} [notification.className] The CSS class name to apply.
     *
     * @param {String} [notification.countdown.text]
     *     In the case that a countdown applies to the notification, the text to
     *     display while the countdown is active.
     *
     * @param {Function} [notification.countdown.callback]
     *     The callback to call when the countdown expires.
     *
     * @param {String} [notification.countdown.remaining]
     *     The number of seconds remaining before the countdown callback is
     *     called.
     *
     * @param {String} [notification.progress.text]
     *     If this notification has associated progress, the text to display
     *     while the operation is occurring.
     *
     * @param {String} [notification.progress.value]
     *     The current state of operation progress, as an arbitrary number
     *     which increases as the operation continues.
     *
     * @param {String} [notification.progress.unit]
     *     The unit of the arbitrary notification.progress.value, if that value
     *     has an associated unit.
     *
     * @param {String} [notification.progress.ratio]
     *     If known, the current status of the operation as a value between
     *     0 and 1 inclusive, where 0 is not yet started, and 1 is complete.
     *
     * @param {Object[]} [notification.actions]
     *     Array of action objects which contain an action name and callback to
     *     be executed when that action is invoked. 
     *                                    
     * @returns {Number} A unique ID for the notification that's just been added.
     * 
     * @example
     * 
     * var id = $scope.addNotification({
     *     'title'      : 'Download',
     *     'text'       : 'You have a file ready for download!',
     *     'actions'    : {
     *         'name'       : 'download',
     *         'callback'   : function () {
     *             // download the file and remove the notification here
     *         }
     *     }
     * });
     */
    $scope.addNotification = function addNotification(notification) {
        var id = ++notificationUniqueID;

        $scope.notifications.push({
            notification    : notification,
            id              : id
        });
        
        return id;
    };
    
    /**
     * Remove a notification by unique ID.
     * 
     * @param {type} id The unique ID of the notification to remove. This ID is
     *                  retrieved from the initial call to addNotification.
     */
    $scope.removeNotification = function removeNotification(id) {
        for(var i = 0; i < $scope.notifications.length; i++) {
            if($scope.notifications[i].id === id) {
                $scope.notifications.splice(i, 1);
                return;
            }
        }
    };
           
    // Allow the permissions to be reloaded elsewhere if needed
    $scope.loadBasicPermissions = function loadBasicPermissions() {
        
        permissionDAO.getPermissions($scope.currentUserID).success(function fetchCurrentUserPermissions(permissions) {
            $scope.currentUserPermissions = permissions;

            // Will be true if the user is an admin
            $scope.currentUserIsAdmin = permissionCheckService.checkPermission($scope.currentUserPermissions, "SYSTEM", undefined, "ADMINISTER");

            // Will be true if the user is an admin or has update access to any object               
            $scope.currentUserHasUpdate = $scope.currentUserIsAdmin || 
                    permissionCheckService.checkPermission($scope.currentUserPermissions, undefined, undefined, "UPDATE");
            
            permissionsLoaded.resolve();
        });
    };

    // Provide simple mechanism for logging out the current user
    $scope.logout = function logout() {
        authenticationService.logout()['finally'](function logoutComplete() {
            $location.path('/login');
        });
    };
    
    // Try to load them now
    $scope.loadBasicPermissions();
    
    // Create event listeners at the global level
    var keyboard = new Guacamole.Keyboard($document[0]);

    // Broadcast keydown events down the scope heirarchy
    keyboard.onkeydown = function onkeydown(keysym) {
        var guacKeydownEvent = $scope.$broadcast('guacKeydown', keysym, keyboard);
        return !guacKeydownEvent.defaultPrevented;
    };
    
    // Broadcast keyup events down the scope heirarchy
    keyboard.onkeyup = function onkeyup(keysym) {
        $scope.$broadcast('guacKeyup', keysym, keyboard);
    };

    // Release all keys when window loses focus
    $window.onblur = function () {
        keyboard.reset();
    };

    // Update title and CSS class upon navigation
    $scope.$on('$routeChangeSuccess', function(event, current, previous) {

        var title = current.$$route.title;
        if (title)
            $scope.page.title = title;

        $scope.page.bodyClassName = current.$$route.bodyClassName || '';

    });

}]);
