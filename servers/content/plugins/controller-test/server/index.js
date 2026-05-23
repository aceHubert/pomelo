const { Controller, Get, Module } = require('@nestjs/common');

class ControllerTestController {
  ping() {
    return {
      ok: true,
      plugin: 'controller-test',
    };
  }
}

const pingDescriptor = Object.getOwnPropertyDescriptor(ControllerTestController.prototype, 'ping');
Get('ping')(ControllerTestController.prototype, 'ping', pingDescriptor);
Controller('api/plugins/controller-test')(ControllerTestController);

class ControllerTestPluginModule {}

Module({
  controllers: [ControllerTestController],
})(ControllerTestPluginModule);

module.exports = {
  ControllerTestPluginModule,
};
